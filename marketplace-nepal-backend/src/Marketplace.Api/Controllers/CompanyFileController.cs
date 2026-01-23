using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompanyFileController : ControllerBase
    {
        private readonly string basePath = Path.Combine(Directory.GetCurrentDirectory(), "ComponeyDetails");

        [HttpGet("{fileName}")]
        [AllowAnonymous]
        public IActionResult GetFile(string fileName)
        {
            var fullPath = Path.Combine(basePath, fileName);

            if (!System.IO.File.Exists(fullPath))
                return NotFound();

            var ext = Path.GetExtension(fullPath).ToLower();
            var contentType = ext switch
            {
                ".pdf" => "application/pdf",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                _ => "application/octet-stream"
            };

            return PhysicalFile(fullPath, contentType);
        }
    }

}
