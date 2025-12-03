using Google.Apis.Auth;
using Marketplace.Api.Models;
using Marketplace.Api.Repositories;
using Marketplace.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Data;
using System.Net.Mail;
using System.Threading.Tasks;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _users;
        private readonly ICompanyRepository _companies;
        private readonly IPasswordHasher<MarketplaceUser> _hasher;
        private readonly IJwtService _jwt;
        private readonly IGoogleTokenVerifier _googleVerifier;
        private readonly IFacebookTokenVerifier _facebookVerifier;
        private readonly IDbConnection _db; // scoped connection to allow transactions

        private static readonly string[] AllowedRoles = new[]
        {
            "super_admin", "portal_manager", "importer", "manufacturer", "wholesaler", "retailer"
        };

        public AuthController(
            IUserRepository users,
            ICompanyRepository companies,
            IPasswordHasher<MarketplaceUser> hasher,
            IJwtService jwt,
            IGoogleTokenVerifier googleVerifier,
            IFacebookTokenVerifier facebookVerifier,
            IDbConnection db)
        {
            _users = users ?? throw new ArgumentNullException(nameof(users));
            _companies = companies ?? throw new ArgumentNullException(nameof(companies));
            _hasher = hasher ?? throw new ArgumentNullException(nameof(hasher));
            _jwt = jwt ?? throw new ArgumentNullException(nameof(jwt));
            _googleVerifier = googleVerifier ?? throw new ArgumentNullException(nameof(googleVerifier));
            _facebookVerifier = facebookVerifier ?? throw new ArgumentNullException(nameof(facebookVerifier));
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        /// <summary>
        /// Register a user. Optionally create a company (req.Company) in the same transaction.
        /// If CompanyId provided it will be used instead of creating a new company.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (req == null) return BadRequest(new { error = "Request body required." });
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { error = "Email and password required." });

            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try { _ = new MailAddress(req.Email); }
            catch
            {
                ModelState.AddModelError(nameof(req.Email), "Invalid email format.");
                return ValidationProblem(ModelState);
            }

            var email = req.Email.Trim().ToLowerInvariant();
            var existing = await _users.GetByEmailAsync(email);
            if (existing != null) return Conflict(new { error = "Email exists." });

            if (_db.State != ConnectionState.Open) _db.Open();
            using var tx = _db.BeginTransaction();
            try
            {
                long? companyId = req.CompanyId;

                // If no CompanyId provided and Company payload present, create it
                if (companyId == null && req.Company != null)
                {
                    var compReq = req.Company;
                    var company = new Company
                    {
                        Name = compReq.Name?.Trim() ?? string.Empty,
                        CompanyType = compReq.CompanyType,
                        RegistrationDocument = compReq.RegistrationDocument,
                        Location = compReq.Address,
                        GoogleMapLocation = compReq.GoogleMapLocation,
                        Status = "pending",
                        Credits = 0
                    };

                    companyId = await _companies.CreateAsync(company, tx);
                }

                var role = (req.Role ?? string.Empty).Trim().ToLowerInvariant();
                if (string.IsNullOrEmpty(role) || !AllowedRoles.Contains(role)) role = "retailer";

                var user = new MarketplaceUser
                {
                    Email = email,
                    FullName = req.FullName,
                    Phone = req.Phone,
                    CompanyId = companyId,
                    Role = role,
                    Status = req.Status ?? "pending",
                    Credits = req.Credits ?? 0
                };

                user.PasswordHash = _hasher.HashPassword(user, req.Password);
                var userId = await _users.CreateAsync(user, tx);

                tx.Commit();

                user.Id = userId;
                var token = _jwt.GenerateToken(user);
                return CreatedAtAction(nameof(Register), new { id = userId }, new { id = userId, token });
            }
            catch (Exception ex)
            {
                try { tx.Rollback(); } catch { /* ignore rollback error */ }
                return StatusCode(500, new { error = "Registration failed", details = ex.Message });
            }
        }

        /// <summary>
        /// Email/password login
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (req == null) return BadRequest(new { error = "Request body required." });
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var email = req.Email.Trim().ToLowerInvariant();
            var user = await _users.GetByEmailAsync(email);
            if (user == null) return Unauthorized();

            var verify = _hasher.VerifyHashedPassword(user, user.PasswordHash ?? string.Empty, req.Password);
            if (verify == PasswordVerificationResult.Failed) return Unauthorized();

            if (verify == PasswordVerificationResult.SuccessRehashNeeded)
            {
                var newHash = _hasher.HashPassword(user, req.Password);
                try { await _users.UpdatePasswordHashAsync(user.Id, newHash); user.PasswordHash = newHash; }
                catch { /* log in production */ }
            }

            await _users.UpdateLastLoginAsync(user.Id, DateTimeOffset.UtcNow);
            var token = _jwt.GenerateToken(user);
            return Ok(new { token });
        }

        [HttpPost("google")]
        public async Task<IActionResult> Google([FromBody] GoogleLoginRequest req)
        {
            if (req == null) return BadRequest(new { error = "Request body required." });
            if (string.IsNullOrWhiteSpace(req.IdToken)) return BadRequest(new { error = "IdToken required." });

            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await _googleVerifier.VerifyAsync(req.IdToken);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Invalid Google token", details = ex.Message });
            }

            var googleId = payload.Subject; // 'sub' claim
            var email = payload.Email?.Trim().ToLowerInvariant();
            var emailVerified = payload.EmailVerified;
            var name = payload.Name;

            // Try find user by google_id
            var user = await _users.GetByGoogleIdAsync(googleId);

            // If not found, try by email (and possibly link)
            if (user == null && !string.IsNullOrEmpty(email))
                user = await _users.GetByEmailAsync(email);

            if (user == null)
            {
                // First time: create a new user from Google data
                if (string.IsNullOrEmpty(email))
                {
                    // policy: require email from Google. If not provided, ask client to collect email.
                    return BadRequest(new { error = "Google account did not provide email. Cannot create user." });
                }

                var newUser = new MarketplaceUser
                {
                    Email = email,
                    FullName = name,
                    Phone = null,
                    Role = "retailer",
                    Status = "active",
                    Credits = 0,
                    PasswordHash = null,
                    GoogleId = googleId
                };

                // Create user (no password). CreateAsync may accept optional transaction; use simple create here.
                var id = await _users.CreateAsync(newUser);
                newUser.Id = id;
                await _users.UpdateLastLoginAsync(id, DateTimeOffset.UtcNow);

                var token = _jwt.GenerateToken(newUser);
                return Ok(new { token });
            }

            // Existing user: if google_id not set, link it only when safe (email matches and is verified)
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                if (!string.IsNullOrEmpty(email) && user.Email == email && emailVerified)
                {
                    await _users.LinkGoogleIdAsync(user.Id, googleId);
                }
                else
                {
                    // Do not auto-link in ambiguous/unverified cases
                    return BadRequest(new { error = "Account exists with same email but cannot be auto-linked. Please sign in and link the Google account from settings." });
                }
            }

            await _users.UpdateLastLoginAsync(user.Id, DateTimeOffset.UtcNow);
            var jwt = _jwt.GenerateToken(user);
            return Ok(new { token = jwt });
        }

        // FACEBOOK endpoint: client sends access_token. Server verifies and auto-creates user if first-time.
        [HttpPost("facebook")]
        public async Task<IActionResult> Facebook([FromBody] FacebookLoginRequest req)
        {
            if (req == null) return BadRequest(new { error = "Request body required." });
            if (string.IsNullOrWhiteSpace(req.AccessToken)) return BadRequest(new { error = "AccessToken required." });

            FacebookUserProfile profile;
            try
            {
                profile = await _facebookVerifier.VerifyAsync(req.AccessToken);
                if (profile == null) return BadRequest(new { error = "Invalid Facebook token." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Facebook token verification failed", details = ex.Message });
            }

            var fbId = profile.Id;
            var email = profile.Email?.Trim().ToLowerInvariant();
            var name = profile.Name;

            // Try find user by facebook_id
            var user = await _users.GetByFacebookIdAsync(fbId);

            // If not found, try by email (and possibly link)
            if (user == null && !string.IsNullOrEmpty(email))
                user = await _users.GetByEmailAsync(email);

            if (user == null)
            {
                // First time create user using Facebook data
                if (string.IsNullOrEmpty(email))
                {
                    // policy: require email; otherwise ask client for additional info or request email permission on client
                    return BadRequest(new { error = "Facebook account did not provide email. Ensure client requested 'email' permission or sign up with email." });
                }

                var newUser = new MarketplaceUser
                {
                    Email = email,
                    FullName = name,
                    Phone = null,
                    Role = "retailer",
                    Status = "active",
                    Credits = 0,
                    PasswordHash = null,
                    FacebookId = fbId
                };

                var id = await _users.CreateAsync(newUser);
                newUser.Id = id;
                await _users.UpdateLastLoginAsync(id, DateTimeOffset.UtcNow);

                var token = _jwt.GenerateToken(newUser);
                return Ok(new { token });
            }

            // Existing user: if facebook_id not set, link it only when safe (email matches)
            if (string.IsNullOrEmpty(user.FacebookId))
            {
                if (!string.IsNullOrEmpty(email) && user.Email == email)
                {
                    await _users.LinkFacebookIdAsync(user.Id, fbId);
                }
                else
                {
                    return BadRequest(new { error = "Account exists with same email but cannot be auto-linked. Please sign in and link the Facebook account from settings." });
                }
            }

            await _users.UpdateLastLoginAsync(user.Id, DateTimeOffset.UtcNow);
            var jwt = _jwt.GenerateToken(user);
            return Ok(new { token = jwt });
        }
    }
}