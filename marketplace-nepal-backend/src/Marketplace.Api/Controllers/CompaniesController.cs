using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Marketpalce.Repository.Repositories.ComponyRepo;
using Marketplace.Models;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // require auth for all actions in this controller
    public class CompaniesController : ControllerBase
    {
        private readonly ICompanyRepository _companies;

        public CompaniesController(ICompanyRepository companies)
        {
            _companies = companies;
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