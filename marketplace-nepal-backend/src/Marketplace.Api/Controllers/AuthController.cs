using Azure.Core;
using Google.Apis.Auth;
using Marketpalce.Repository.Repositories.ComponyRepo;
using Marketpalce.Repository.Repositories.UserReop;
using Marketplace.Api.DOTModels;
using Marketplace.Api.Services.FacebookToken;
using Marketplace.Api.Services.GoogleTokenVerifier;
using Marketplace.Api.Services.Hassing;
using Marketplace.Api.Services.Helper;
using Marketplace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
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
        private readonly IWebHostEnvironment _env;
        private readonly IUserRepository _users;
        private readonly ICompanyRepository _companies;
        private readonly IPasswordHasher<MarketplaceUser> _hasher;
        private readonly IJwtService _jwt;
        private readonly IGoogleTokenVerifier _googleVerifier;
        private readonly IFacebookTokenVerifier _facebookVerifier;
        private readonly IDbConnection _db; // scoped connection to allow transactions
        ModuleToCommon moduleToCommon = new ModuleToCommon();
        private static readonly string[] AllowedRoles = new[]
        {
            "super_admin", "portal_manager", "importer", "manufacturer", "wholesaler", "retailer"
        };

        public AuthController(
        IWebHostEnvironment env,
        IUserRepository users,
            ICompanyRepository companies,
            IPasswordHasher<MarketplaceUser> hasher,
            IJwtService jwt,
            IGoogleTokenVerifier googleVerifier,
            IFacebookTokenVerifier facebookVerifier,
            IDbConnection db)
        {
            _env = env;
            _users = users ?? throw new ArgumentNullException(nameof(users));
            _companies = companies ?? throw new ArgumentNullException(nameof(companies));
            _hasher = hasher ?? throw new ArgumentNullException(nameof(hasher));
            _jwt = jwt ?? throw new ArgumentNullException(nameof(jwt));
            _googleVerifier = googleVerifier ?? throw new ArgumentNullException(nameof(googleVerifier));
            _facebookVerifier = facebookVerifier ?? throw new ArgumentNullException(nameof(facebookVerifier));
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        [HttpPost("registerNewUser")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Register([FromForm] ComponieCommonModel common)
        {
            Reasult response= new Reasult();
            NewRegisterRequest req = new NewRegisterRequest();
            req.user = moduleToCommon.Map<RegisterRequest>(common.Register);
            req.Company = moduleToCommon.Map<CompanyCreateRequest>(common.Company);
            if (req == null) return BadRequest(new { error = "Request body required." });
            if (string.IsNullOrWhiteSpace(req.user.Email) || string.IsNullOrWhiteSpace(req.user.Password))
                return BadRequest(new { error = "Email and password required." });

            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try { _ = new MailAddress(req.user.Email); }
            catch
            {
                ModelState.AddModelError(nameof(req.user.Email), "Invalid email format.");
                return ValidationProblem(ModelState);
            }

            var email = req.user.Email.Trim().ToLowerInvariant();
            var existing = await _users.GetByEmailAsync(email);
            if (existing != null) return Conflict(new { error = "Email exists." });

            // --- handle file upload (if any) ---
            IFormFile uploadedFile = null;
            if (Request?.Form?.Files?.Count > 0)
            {
                // try to find a file named RegistrationDocument first, otherwise take the first file
                
                uploadedFile = Request.Form.Files.FirstOrDefault(f =>
                    string.Equals(f.Name, "RegistrationDocument", StringComparison.OrdinalIgnoreCase))
                    ?? Request.Form.Files.FirstOrDefault();
            }

            string savedFileUrl = null;
            string originalFileName = null;
            if (uploadedFile != null && uploadedFile.Length > 0)
            {
                // Basic validation (adjust as needed)
                const long MaxFileBytes = 10 * 1024 * 1024; 
                if (uploadedFile.Length > MaxFileBytes)
                {
                    return BadRequest(new { error = "Uploaded file is too large." });
                }

                // Optionally check extension
                var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" ,".xlsx"};
                var ext = Path.GetExtension(uploadedFile.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(ext))
                {
                    response.code = 500;
                    response.Message = "Invalid file type. Allowed: pdf, jpg, jpeg, png.";
                    return BadRequest(response);
                }

                originalFileName = Path.GetFileName(uploadedFile.FileName);
                var uniqueFileName = $"{Guid.NewGuid()}{ext}";

                // Save under wwwroot/uploads/companies/
                var webRoot = _env.WebRootPath;
                var uploads = Path.Combine(Directory.GetCurrentDirectory(), "ComponeyDetails");
                if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);
                var filePath = Path.Combine(uploads, uniqueFileName);
                using (var fs = new FileStream(filePath, FileMode.Create))
                {
                    await uploadedFile.CopyToAsync(fs);
                }
                req.Company.RegistrationDocument = uniqueFileName;
            }
            // --- end file upload handling ---

            if (_db.State != ConnectionState.Open) _db.Open();
            using var tx = _db.BeginTransaction();
            try
            {
                long? companyId = req.user.CompanyId;

                // If no CompanyId provided and Company payload present, create it
                if ((companyId == null && req.Company != null) || companyId == 0)
                {
                    var compReq = req.Company;
                    var company = new Company
                    {
                        Name = compReq.Name?.Trim() ?? string.Empty,
                        CompanyType = compReq.CompanyType,
                        // If compReq contains a value already, keep it; otherwise we'll set from uploaded file
                        RegistrationDocument = compReq.RegistrationDocument,
                        MobilePhone = compReq.MobilePhone,
                        UserType = compReq.UserType,
                        Location = compReq.Address,
                        GoogleMapLocation = compReq.GoogleMapLocation,
                        Status = "pending",
                        ApproveTs = "n",
                        Credits = 0
                    };

                    // If a file was uploaded, set RegistrationDocument to the public URL
                    if (!string.IsNullOrEmpty(savedFileUrl))
                    {
                        company.RegistrationDocument = savedFileUrl;

                        // If company has a property to store the original filename (e.g. RegistrationDocumentName),
                        // set it via reflection to avoid compile-time dependency.
                        var nameProp = company.GetType().GetProperty("RegistrationDocumentName");
                        if (nameProp != null && nameProp.CanWrite)
                        {
                            nameProp.SetValue(company, originalFileName);
                        }
                    }

                    companyId = await _companies.CreateAsync(company, tx);
                }

                var role = (req.user.Role ?? string.Empty).Trim().ToLowerInvariant();
                if (string.IsNullOrEmpty(role) || !AllowedRoles.Contains(role)) role = "retailer";

                var user = new MarketplaceUser
                {
                    Email = email,
                    FullName = req.user.FullName,
                    Phone = req.user.Phone,
                    CompanyId = companyId,
                    Role = role,
                    Status = req.user.Status ?? "pending",
                    Credits = req.user.Credits ?? 0
                };

                user.PasswordHash = _hasher.HashPassword(user, req.user.Password);
                var userId = await _users.CreateAsync(user, tx);

                tx.Commit();
                response.code = 0;
                response.Message = "Your Componey and has been Registered Succesfully Please wait for Admin to Approve your Request";
   
                // return 201 Created with location header for the created resource
                return CreatedAtAction(nameof(Register), new { id = userId }, response);

            }
            catch (Exception ex)
            {
                try { tx.Rollback(); } catch { /* ignore rollback error */ }

                    response.code = 500;
                    response.Message = "Registration failed";
                    response.details = ex.Message;
                return StatusCode(500, response);
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
            var user = await _users.GetByEmailAsync(googleId:googleId);

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
            if (string.IsNullOrEmpty(fbId))
                return BadRequest(new { error = "Facebook profile did not provide an ID." });

            var email = profile.Email?.Trim().ToLowerInvariant();
            var name = profile.Name;

            // Try find user by facebook_id
            var user = await _users.GetByEmailAsync(facebookId:fbId);

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