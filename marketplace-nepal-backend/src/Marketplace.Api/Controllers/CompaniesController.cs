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
    [Authorize] // require auth for all actions in this controller
    public class CompaniesController : ControllerBase
    {
        private readonly ICompanyRepository _companies;
        private readonly ICompanyTypeService _companyTypeService;

        public CompaniesController(ICompanyRepository companies, ICompanyTypeService companyTypeService)
        {
            _companies = companies;
            _companyTypeService = companyTypeService;
        }
        [HttpGet("send-registration-link")]
        public async Task<IActionResult> SendRegistrationLink( string email)
        {
            string? customClaim = HttpContext.User.GetClaimValue("company_id");
            string? ComponeyNamer = HttpContext.User.GetClaimValue("company_Name");

            await _companyTypeService.SendRegistrationEmailAsync(
                email,
                customClaim,
                ComponeyNamer
            );

            return Ok(new
            {
                message = "Registration link sent to email"
            });
        }


        /// <summary>
        /// Create a company.
        /// Only users in roles 'portal_manager' or 'super_admin' may create companies.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "portal_manager,super_admin")]
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
     
    }
}