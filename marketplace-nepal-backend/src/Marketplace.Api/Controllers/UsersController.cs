using Marketpalce.Repository.Repositories.ComponyRepo;
using Marketpalce.Repository.Repositories.UserReop;
using Marketplace.Api.Services.FacebookToken;
using Marketplace.Api.Services.GoogleTokenVerifier;
using Marketplace.Api.Services.Hassing;
using Marketplace.Api.Services.Helper;
using Marketplace.Model.Models;
using Marketplace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Data;
using System.Net.Mail;
using System.Security.Claims;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // require auth for all actions in this controller
    public class UsersController : ControllerBase
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

        public UsersController(
            IUserRepository users,
            ICompanyRepository companies,
            IPasswordHasher<MarketplaceUser> hasher,
            IDbConnection db)
        {
            _users = users ?? throw new ArgumentNullException(nameof(users));
            _companies = companies ?? throw new ArgumentNullException(nameof(companies));
            _hasher = hasher ?? throw new ArgumentNullException(nameof(hasher));
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }
        [HttpGet("GetAll/{id:long}")]
        public async Task<ActionResult<IEnumerable<MarketplaceUser>>> GetAllUser(long id)
        {
            try
            {
                // Fetch all users related to the given id (e.g., company id)
                var users = await _users.GetAllid(id);

                // Always return an array (even if empty)
                return Ok(users ?? new List<MarketplaceUser>());
            }
            catch (Exception ex)
            {
                // Return 500 if something goes wrong
                return StatusCode(500, new { error = "Failed to fetch users", details = ex.Message });
            }
        }
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {

            string? customClaim = HttpContext.User.GetClaimValue("MyCustomClaim");
            
            var c = await _users.GetByIdAsync(id);
            if (c == null) return NotFound();
            return Ok(c);
        }

        [HttpPost("CreateUser")]
        public async Task<IActionResult> Register([FromBody] MarketplaceUser req)
        {
            string? customClaim = HttpContext.User.GetClaimValue("MyCustomClaim");
            if (req == null) return BadRequest(new { error = "Request body required." });
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.PasswordHash))
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




                var role = (req.Role ?? string.Empty).Trim().ToLowerInvariant();
                if (string.IsNullOrEmpty(role) || !AllowedRoles.Contains(role)) role = "retailer";

                var user = new MarketplaceUser
                {
                    Email = email,
                    FullName = req.FullName,
                    Phone = req.Phone,
                    CompanyId = companyId,
                    Role = role,
                    Status = req.Status ?? "pending"
                };

                user.PasswordHash = _hasher.HashPassword(user, req.PasswordHash);
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
        [HttpPost("EditUser")]
        public async Task<IActionResult> EditUser([FromBody] MarketplaceUser req)
        {
            if (req == null) return BadRequest(new { error = "Request body required." });
            if (string.IsNullOrWhiteSpace(req.Email))
                return BadRequest(new { error = "Email required." });

            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try { _ = new MailAddress(req.Email); }
            catch
            {
                ModelState.AddModelError(nameof(req.Email), "Invalid email format.");
                return ValidationProblem(ModelState);
            }

            var email = req.Email.Trim().ToLowerInvariant();

            // Check if the user exists
            var user = await _users.GetuserByid(req.Id.ToString()); // Implement this repo function if missing
            if (user == null)
                return NotFound(new { error = "User not found." });

            if (_db.State != ConnectionState.Open) _db.Open();
            using var tx = _db.BeginTransaction();
            try
            {
                // Update only editable properties
                user.Id = req.Id;
                user.Email = email;
                user.FullName = req.FullName ?? user.FullName;
                user.Phone = req.Phone ?? user.Phone;
                user.CompanyId = req.CompanyId ?? user.CompanyId;
                user.Role = (req.Role ?? user.Role).Trim().ToLowerInvariant();
                user.Status = req.Status ?? user.Status;
                user.Tier = req.Tier ?? user.Tier;
                user.GoogleId = req.GoogleId ?? user.GoogleId;
                user.FacebookId = req.FacebookId ?? user.FacebookId;
                if (!string.IsNullOrWhiteSpace(req.PasswordHash))
                    user.PasswordHash = _hasher.HashPassword(user, req.PasswordHash);

                var success = await _users.UpdateUserAsync(user, tx);

                if (!success)
                {
                    tx.Rollback();
                    return StatusCode(500, new { error = "Edit failed." });
                }

                tx.Commit();
                return Ok(new { id = user.Id });
            }
            catch (Exception ex)
            {
                try { tx.Rollback(); } catch { /* ignore rollback error */ }
                return StatusCode(500, new { error = "Edit failed", details = ex.Message });
            }
        }
        [HttpPost("ApproveUser/{id}")]
        public async Task<IActionResult> ApproveUser(long id, [FromBody] string? details = null)
        {
            var approvedBy = User?.Identity?.Name ?? "system";
            details ??= "User approved";

            if (_db.State != ConnectionState.Open) _db.Open();
            using var tx = _db.BeginTransaction();
            try
            {
                var user = await _users.GetByIdAsync(id);
                if (user == null)
                    return NotFound(new { error = "User not found." });

                var success = await _users.ApproveUserAsync(id, approvedBy, details, tx);
                if (!success)
                {
                    tx.Rollback();
                    return StatusCode(500, new { error = "Approval failed." });
                }

                tx.Commit();
                return Ok(new { id });
            }
            catch (Exception ex)
            {
                try { tx.Rollback(); } catch { }
                return StatusCode(500, new { error = "Approval failed", details = ex.Message });
            }
        }
    }
}
