using Marketpalce.Repository.Repositories.ComponyRepo;
using Marketplace.Api.Models;
using Marketplace.Api.Services.Company;
using Marketplace.Api.Services.EmailService;
using Marketplace.Api.Services.Helper;
using Marketplace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] 
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



        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CompanyCreateRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Name))
                return BadRequest(new { error = "Company name is required." });

            var company = new Company
            {
                Name = req.Name.Trim(),
                CompanyType = req.CompanyType,
                RegistrationDocument = req.RegistrationDocument,
                //Address = req.Address,
                GoogleMapLocation = req.GoogleMapLocation
            };

            var id = await _companies.CreateAsync(company);
            return CreatedAtAction(nameof(GetById), new { id }, new CompanyCreatedResponse(id));
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


    }
}