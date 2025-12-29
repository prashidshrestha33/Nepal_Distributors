using Marketplace.Api.Services.Company;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/public")]
    [AllowAnonymous]
    public class PublicCompanyTypeController : ControllerBase
    {
        public readonly ICompanyTypeService _companyService;
        public PublicCompanyTypeController(ICompanyTypeService companyService)
        {
            _companyService = companyService;
        }
        [HttpGet("companyType")]
        public async Task<IActionResult> GetCatalogTypes()
        {
            var result = await _companyService.GetCompanyTypesAsync();
            return new JsonResult(result);
        }
    }
}

