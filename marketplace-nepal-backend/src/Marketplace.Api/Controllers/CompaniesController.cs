using Marketpalce.Repository.Repositories.ComponyRepo;
using Marketplace.Api.Models;
using Marketplace.Api.Services.Company;
using Marketplace.Api.Services.EmailService;
using Marketplace.Api.Services.Helper;
using Marketplace.Helpers;
using Marketplace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Win32;
using System.Data;
using System.Net.Mail;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "sadmin")]
    public class CompaniesController : ControllerBase
    {
        private readonly ICompanyRepository _companies;
        private readonly ICompanyTypeService _companyTypeService;
        private readonly IEmailService _emailService;

        public CompaniesController(ICompanyRepository companies, ICompanyTypeService companyTypeService,
            IEmailService emailService )
        {
            _emailService = emailService;
            _companies = companies;
            _companyTypeService = companyTypeService;
        }
        [HttpGet("send-registration-link")]
        public async Task<IActionResult> SendRegistrationLink( string email, string role, string company_id = null, string company_Name = null)
        {
            string? customClaim = company_id!=null ? company_id: HttpContext.User.GetClaimValue("company_id");
            string? ComponeyNamer = company_Name != null ? company_Name: HttpContext.User.GetClaimValue("company_Name");

            await _companyTypeService.SendRegistrationEmailAsync(
                email,
                customClaim,
                ComponeyNamer,
                role
            );
            return Ok(new
            {
                message = "Registration link sent to email"
            });
        }



        /// <summary>
        /// Get company by id. Any authenticated user can view.
        /// </summary>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var c = await _companies.GetByIdAsync(id);
            if (c == null) return NotFound();
            return Ok(c);
        }

        /// <summary>
        /// List companies (paged). Any authenticated user can view.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var items = await _companies.ListAsync(page, pageSize);
            return Ok(items);
        }
        [HttpPost("approve")]
        public async Task<IActionResult> ApproveCompany([FromBody] ApproveCompanyRequest req)
        {
            if (req == null || req.CompanyId <= 0)
                return BadRequest(new { error = "Valid company ID is required." });

            try
            {
                // 1️⃣ Update company + users and get admin emails
                var (totalRows, emails) = await _companies.ApproveCompanyAsync(
                    req.CompanyId,
                    req.ApproveFg,
                    req.RejectComment);

                // 2️⃣ Assign categories if provided
                if (!string.IsNullOrWhiteSpace(req.AssignCategory))
                {
                    var categoryIds = req.AssignCategory
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => long.Parse(x.Trim()));

                    foreach (var categoryId in categoryIds)
                    {
                        await _companies.AssignCategoryAsync(categoryId, req.CompanyId);
                    }
                }

                // 3️⃣ Send email to Cadmin users if approved
                if (req.ApproveFg.ToUpper() == "Y" && emails.Any())
                {
                    var html = @"
                <h3>Congratulations</h3>
                <p>Your company has been approved successfully.</p>
                <p>You can now log in and start using the system.</p>";

                    foreach (var email in emails)
                    {
                        await _emailService.SendAsync(
                            email,
                            "Company Approved",
                            html
                        );
                    }
                }

                return Ok(new
                {
                    success = true,
                    message = req.ApproveFg.ToUpper() == "Y"
                        ? "Company approved successfully."
                        : "Company rejected.",
                    totalRows
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}/detail")]
        public async Task<IActionResult> GetCompanyDetail(int id)
        {
            var result = await _companies.GetCompanyDetailAsync(id);
            if (result == null)
                return NotFound();

            return Ok(result);
        }
        [HttpPost("update")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(20_000_000)]
        public async Task<IActionResult> UpdateCompany([FromForm] ComponieUpdateCommonModel model)
        {
            if (model?.Company == null)
                return BadRequest(new { error = "Company data is required." });

            try
            {
                // 📎 Handle document upload
                if (model.CompanyDocument != null && model.CompanyDocument.Length > 0)
                {
                    const long MaxFileBytes = 10 * 1024 * 1024;
                    if (model.CompanyDocument.Length > MaxFileBytes)
                        return BadRequest(new { error = "File too large." });

                    var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".xlsx" };
                    var ext = Path.GetExtension(model.CompanyDocument.FileName).ToLowerInvariant();

                    if (!allowedExtensions.Contains(ext))
                        return BadRequest(new { error = "Invalid file type." });

                    var uniqueFileName = $"{Guid.NewGuid()}{ext}";
                    var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "ComponeyDetails");

                    if (!Directory.Exists(uploadPath))
                        Directory.CreateDirectory(uploadPath);

                    var filePath = Path.Combine(uploadPath, uniqueFileName);
                    using var fs = new FileStream(filePath, FileMode.Create);
                    await model.CompanyDocument.CopyToAsync(fs);

                    model.Company.RegistrationDocument = uniqueFileName;
                }
                GeoPoints? geo = null;
                if (!string.IsNullOrEmpty(model.Company.GoogleMapLocation))
                {
                    geo = GeoHelper.ParseGeoPoint(model.Company.GoogleMapLocation);
                }

                var company = new Company
                {
                    Componeyid = model.Company.CompanyId,
                    Name = model.Company.Name?.Trim() ?? string.Empty,
                    ContactPerson = model.Company.CompamyPerson,
                    RegistrationDocument = model.Company.RegistrationDocument,
                    MobilePhone = model.Company.MobilePhone,
                    LandlinePhone = model.Company.LandLinePhone,
                    Location = model.Company.Address,
                    GoogleMapLocationpoint = geo,
                    Status = "updated",
                    ApproveFg = "n"
                };
                var updated = await _companies.UpdateCompanyAsync(company);
                    if (updated <= 0)
                        return NotFound(new { error = "Company not found." });

                return Ok(new
                {
                    success = true,
                    message = "Company information saved successfully.",
                    updated
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Company save failed.",
                    details = ex.Message
                });
            }
        }
    }

}
