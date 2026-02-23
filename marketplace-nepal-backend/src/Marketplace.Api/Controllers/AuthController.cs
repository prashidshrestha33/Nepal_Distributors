using Azure.Core;
using Google.Apis.Auth;
using Marketpalce.Repository.Repositories.ComponyRepo;
using Marketpalce.Repository.Repositories.StaticValueReop;
using Marketpalce.Repository.Repositories.UserReop;
using Marketplace.Api.Models;
using Marketplace.Api.Services.EmailService;
using Marketplace.Api.Services.FacebookToken;
using Marketplace.Api.Services.GoogleTokenVerifier;
using Marketplace.Api.Services.Hassing;
using Marketplace.Api.Services.Helper;
using Marketplace.Helpers;
using Marketplace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Ocsp;
using System;
using System.Data;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using static Azure.Core.HttpHeader;
using static System.Net.WebRequestMethods;

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
        private readonly IEmailService _emailService;
        private readonly IStaticValueRepository _staticValueRepo;
        private readonly IConfiguration _config;
        private ModuleToCommon moduleToCommon = new ModuleToCommon();
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
            IDbConnection db,
            IEmailService emailService,
            IStaticValueRepository staticValueRepo,
        IConfiguration config)
        {
            _env = env;
            _users = users ?? throw new ArgumentNullException(nameof(users));
            _companies = companies ?? throw new ArgumentNullException(nameof(companies));
            _hasher = hasher ?? throw new ArgumentNullException(nameof(hasher));
            _jwt = jwt ?? throw new ArgumentNullException(nameof(jwt));
            _googleVerifier = googleVerifier ?? throw new ArgumentNullException(nameof(googleVerifier));
            _facebookVerifier = facebookVerifier ?? throw new ArgumentNullException(nameof(facebookVerifier));
            _db = db ?? throw new ArgumentNullException(nameof(db)); _config = config;
            _emailService = emailService;
            _staticValueRepo = staticValueRepo;

        }
        private string Generate6DigitAlphaNumeric()
        {
            const string letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string digits = "0123456789";
            var random = new Random();

            // Step 1: Pick 2 random digits
            var otpDigits = new char[2];
            for (int i = 0; i < 2; i++)
            {
                otpDigits[i] = digits[random.Next(digits.Length)];
            }

            // Step 2: Pick remaining 4 characters from letters + digits
            var allChars = letters + digits;
            var otpChars = new char[4];
            for (int i = 0; i < 4; i++)
            {
                otpChars[i] = allChars[random.Next(allChars.Length)];
            }

            // Step 3: Combine both arrays
            var otp = otpDigits.Concat(otpChars).ToArray();

            // Step 4: Shuffle the array to randomize positions
            return new string(otp.OrderBy(x => random.Next()).ToArray());
        }

        [HttpGet("registerOTP")]
        public async Task<IActionResult> registerOTP(string email)
        {
            string otp = Generate6DigitAlphaNumeric().ToString();
            await _users.UpdateOtpTokem(otp, email);
            var placeholders = new Dictionary<string, string>
            {
                { "#OPTRANVAL#", otp }
            };

            string? htmlTemplate = await MailHelper.GetTemplateAsync(_staticValueRepo, "OPTTemplate", placeholders);
            await _emailService.SendAsync(
                email,
                "Login Password",
                htmlTemplate
            );

            return Ok(new
            {
                message = "Registration link sent to email"
            });
        }
        [HttpGet("registerOTPValidate")]
        public async Task<IActionResult> RegisterOTPValidate(string email,string oTP)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(oTP))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Email and OTP are required"
                });
            }

            bool otpValid = await _users.CheckOtpAUth(email, oTP);

            if (!otpValid)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Please validate email to complete signup process"
                });
            }

            return Ok(new
            {
                success = true,
                message = "OTP validated successfully"
            });
        }

        [HttpGet("requestLoginOTP")]
        public async Task<IActionResult> RequestLoginOTP(string email)
        {
            var existing = await _users.GetByEmailAsync(email);
            if (existing == null)
                return Conflict(new { error = "Account Not Exist" });
            string otp = Generate6DigitAlphaNumeric().ToString();
            await _users.UpdateAuthTokenAsync(existing.Id, otp, email);
            var encryptedData = EncryptionHelper.Encrypt(otp);
            var urlEncoded = Uri.EscapeDataString(encryptedData);
            var registrationLink = _config["AppSettings:FrontendBaseUrl"] + $"/ForgetPassword?token={urlEncoded}";

            var placeholders = new Dictionary<string, string>
            {
                { "#CNAME#", existing.CompanyName},
                { "#OPTRANVAL#", otp }
            };

            string? htmlTemplate = await MailHelper.GetTemplateAsync(_staticValueRepo, "OPTTemplate", placeholders);
            await _emailService.SendAsync(
                email,
                "Login Password",
                htmlTemplate
            );

            return Ok(new
            {
                message = "Registration link sent to email"
            });
        }

        [HttpPost("registerNewUser")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Register([FromForm] ComponieCommonModel common)
        {
            string componeyidglb = null;
            string decrole = null;
            Reasult response = new Reasult();
            NewRegisterRequest req = new NewRegisterRequest();
            req.user = moduleToCommon.Map<RegisterRequest>(common.Register);
            if (!string.IsNullOrEmpty(common.Token))
            {

                var payload = EncryptionHelper.Decrypt<RegistrationEmailPayload>(common.Token);
                componeyidglb = payload.CompanyId;
                req.user.Role = payload.role;
            }
            if (common.Company != null && string.IsNullOrEmpty(common.Token))
            {
                req.Company = moduleToCommon.Map<CompanyCreateRequest>(common.Company);
            }

            if (req == null) return BadRequest(new { error = "Request body required." });


            if (string.IsNullOrWhiteSpace(req.user.Email))
                return BadRequest(new { error = "Email required." });
            if (!string.IsNullOrWhiteSpace(req.user.Provider) && string.IsNullOrWhiteSpace(req.user.ID) && string.IsNullOrWhiteSpace(req.user.Token))
            {
                return BadRequest(new { error = "Invalid ID Or token" });
            }
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
            string savedFileUrl = null;
            string originalFileName = null;
            if (string.IsNullOrEmpty(common.Token))
            {
                // --- handle file upload (if any) ---
                IFormFile uploadedFile = null;
                if (Request?.Form?.Files?.Count > 0)
                {
                    // try to find a file named RegistrationDocument first, otherwise take the first file

                    uploadedFile = Request.Form.Files.FirstOrDefault(f =>
                        string.Equals(f.Name, "RegistrationDocument", StringComparison.OrdinalIgnoreCase))
                        ?? Request.Form.Files.FirstOrDefault();
                }

                if (uploadedFile != null && uploadedFile.Length > 0)
                {
                    // Basic validation (adjust as needed)
                    const long MaxFileBytes = 10 * 1024 * 1024;
                    if (uploadedFile.Length > MaxFileBytes)
                    {
                        return BadRequest(new { error = "Uploaded file is too large." });
                    }

                    // Optionally check extension
                    var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".xlsx" };
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
            }
            // --- end file upload handling ---

            if (_db.State != ConnectionState.Open) _db.Open();
            using var tx = _db.BeginTransaction();
            try
            {
                long? companyId = componeyidglb != null ? Convert.ToInt64(componeyidglb) : req.user.CompanyId;

                // If no CompanyId provided and Company payload present, create it
                if ((companyId == null && req.Company != null) || companyId == 0)
                {
                    var compReq = req.Company;
                    GeoPoints? geo = null;
                    if ( !string.IsNullOrEmpty(compReq.GoogleMapLocation))
                    {
                        geo = GeoHelper.ParseGeoPoint(compReq.GoogleMapLocation);
                    }
                    var company = new Company
                    {
                        Name = compReq.Name?.Trim() ?? string.Empty,
                        CompanyType = compReq.CompanyType,
                        ContactPerson = compReq.CompamyPerson,
                        RegistrationDocument = compReq.RegistrationDocument,
                        MobilePhone = compReq.MobilePhone,
                        LandlinePhone = compReq.LandLinePhone,
                        UserType = compReq.UserType,
                        Location = compReq.Address,
                        GoogleMapLocationpoint = geo,
                        Status = "pending",
                        ApproveFg = "n",
                        Credits = 5
                    };

                    if (!string.IsNullOrEmpty(savedFileUrl))
                    {
                        company.RegistrationDocument = savedFileUrl;
                        var nameProp = company.GetType().GetProperty("RegistrationDocumentName");
                        if (nameProp != null && nameProp.CanWrite)
                        {
                            nameProp.SetValue(company, originalFileName);
                        }
                    }

                    companyId = await _companies.CreateAsync(company, tx);
                }

                var role = (req.user.Role ?? string.Empty).Trim().ToLowerInvariant();
                if (string.IsNullOrEmpty(role) || !AllowedRoles.Contains(role)) role = "sadmin";

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
                user.GoogleId = !req.user.Provider.IsNullOrEmpty() && req.user.Provider == "GOOGLE" ? _hasher.HashPassword(user, req.user.ID) : "";
                user.FacebookId = !req.user.Provider.IsNullOrEmpty() && req.user.Provider == "FACEBOOK" ? _hasher.HashPassword(user, req.user.ID) : "";
                var userId = await _users.CreateAsync(user, tx);

                tx.Commit();
                response.code = 0;
                response.Message = "Your Componey and has been Registered Succesfully Please wait for Admin to Approve your Request";

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


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (req == null)
                return BadRequest(ApiResponse<LoginResponse>.BadRequest(
                    message: "Request body is required"
                ));

            var email = req.Email?.Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(email))
                return Unauthorized(ApiResponse<LoginResponse>.Create(
                    401,
                    message: "Email is required"
                ));

            var user = await _users.GetByEmailAsync(email);

            // 🔹 Social login but user not registered
            if (user == null && !string.IsNullOrEmpty(req.id))
            {
                return Unauthorized(ApiResponse<LoginResponse>.Create(
                    401,
                    new LoginResponse
                    {
                        Success = false,
                        Status = LoginStatus.SocialUserNotRegistered,
                        Message = "Company not registered. Please complete signup.",
                        SocialUser = new SocialUserDto
                        {
                            Email = email,
                            Provider = req.Provider ?? string.Empty,
                            ProviderId = req.id
                        }
                    }
                ));
            }

            // 🔹 User not found
            if (user == null)
            {
                return Unauthorized(ApiResponse<LoginResponse>.Create(
                    401,
                    new LoginResponse
                    {
                        Success = false,
                        Status = LoginStatus.UserNotFound,
                        Message = "User not found"
                    }
                ));
            }

            // 🔹 Credential / OTP verification
            PasswordVerificationResult verify = PasswordVerificationResult.Failed; // Initialize to avoid null
            bool otpValid = false;

            if (!string.IsNullOrEmpty(req.Provider))
            {
                // Social login
                if (req.Provider == "GOOGLE")
                {
                    verify = _hasher.VerifyHashedPassword(
                        user,
                        user.GoogleId ?? string.Empty,
                        req.id ?? string.Empty
                    );
                }
                else if (req.Provider == "FACEBOOK")
                {
                    verify = _hasher.VerifyHashedPassword(
                        user,
                        user.FacebookId ?? string.Empty,
                        req.id ?? string.Empty
                    );
                }
            }
            else if (!string.IsNullOrEmpty(req.OTP))
            {
                otpValid = await _users.CheckAuthTokenAsync(user.Id, req.OTP);
            }
            else if (!string.IsNullOrEmpty(user.PasswordHash))
            {
                verify = _hasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash ?? string.Empty,
                    req.Password ?? string.Empty
                );
            }
            else
            {
                return Unauthorized(ApiResponse<LoginResponse>.Create(
                    402,
                    new LoginResponse
                    {
                        Success = false,
                        Status = LoginStatus.InvalidCredentials,
                        Message = "Invalid credentials"
                    }
                ));
            }
            bool loginFailed = (string.IsNullOrEmpty(req.OTP) && verify == PasswordVerificationResult.Failed)
                               || (!string.IsNullOrEmpty(req.OTP) && otpValid == false);

            if (loginFailed)
            {
                return Unauthorized(ApiResponse<LoginResponse>.Create(
                    402,
                    new LoginResponse
                    {
                        Success = false,
                        Status = LoginStatus.InvalidCredentials,
                        Message = "Invalid credentials"
                    }
                ));
            }
            if (user.ApproveFG == "n")
            {
                return StatusCode(403, ApiResponse<LoginResponse>.Create(
                    403,
                    new LoginResponse
                    {
                        Success = false,
                        Status = LoginStatus.ApprovalPending,
                        Message = "Your registration is under review. Please contact Admin."
                    }
                ));
            }

            // 🔹 Rehash password if needed
            if (verify == PasswordVerificationResult.SuccessRehashNeeded && !string.IsNullOrEmpty(req.Password))
            {
                var newHash = _hasher.HashPassword(user, req.Password);
                await _users.UpdatePasswordHashAsync(user.Id, newHash);
            }

            await _users.UpdateLastLoginAsync(user.Id, DateTimeOffset.UtcNow);

            // 🔹 SUCCESS — Generate token
            var token = _jwt.GenerateToken(user);

            return Ok(ApiResponse<LoginResponse>.Ok(
                new LoginResponse
                {
                    Success = true,
                    Status = LoginStatus.Success,
                    Token = token
                },
                "Login successful"
            ));
        }

        [HttpGet("ForgetPasswordSendMail")]
        public async Task<IActionResult> ForgetPasswordSendMail(string email)
        {

            var existing = await _users.GetByEmailAsync(email);

            if (existing == null) return Conflict(new { error = "Invalid Email" });
            string ran = Generate6DigitAlphaNumeric();
            _users.UpdateAuthTokenAsync(existing.Id, ran, email);
            var encryptedData = EncryptionHelper.Encrypt(ran);

            var urlEncoded = Uri.EscapeDataString(encryptedData);

            var registrationLink = _config["AppSettings:FrontendBaseUrl"] + $"/ForgetPassword?token={urlEncoded}";

            var placeholders = new Dictionary<string, string>
            {
                { "#registrationLink#", registrationLink }
            };

            string? htmlTemplate = await MailHelper.GetTemplateAsync(_staticValueRepo, "OPTTemplate", placeholders);
            var html = $@"
        <h3>orget Password</h3>
        <p>Please click the button below to complete company registration.</p>
        <a href='{registrationLink}'
           style='padding:10px 15px;background:#465fff;color:#fff;
           text-decoration:none;border-radius:5px'>
           Complete Registration
        </a>
        <p>This link expires in 24 hours.</p>
    ";
            await _emailService.SendAsync(
              email,
              "Forget Password",
              html
          );

            return Ok(new
            {
                message = "Registration link sent to email"
            });
        }
        [HttpPost("ForgetPassword")]
        public async Task<IActionResult> ForgetPassword([FromBody] ForgetPwdRequest req)
        {
            string componeyidglb = null;
            if (string.IsNullOrEmpty(req.Token)) return BadRequest(new { error = "Invalid token" });
           

            var payload = EncryptionHelper.Decrypt<string>(req.Token);
            var existing = await _users.AuthTokenValidation(payload);
            if (existing.isRead == null|| existing.isRead == 1) return Conflict(new { error = "This token has already been used." });
            string hasspasswordpass = _hasher.HashPassword(null, req.Password);
            if (!string.IsNullOrEmpty(hasspasswordpass)) { 
                _users.UpdatePasswordAsync(existing.userId.Value, hasspasswordpass); 
            }
         

            return Ok(new
            {
                message = "Password Changed Successfully"
            });
        }
        public static int Generate6DigitNumber()
        {
            return RandomNumberGenerator.GetInt32(100000, 1000000);
        }
    }
}