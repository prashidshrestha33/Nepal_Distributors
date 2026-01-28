using Marketpalce.Repository.Repositories.ProductRepo;
using Marketplace.Api.Models;
using Marketplace.Api.Services.Helper;
using Marketplace.Model.Models;
using Marketplace.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductRepository repositorysitory;
        private readonly IDbConnection _db;
        private ModuleToCommon moduleToCommon = new ModuleToCommon();
        public ProductController(IProductRepository repo, IDbConnection db)
        {
            repositorysitory = repo;
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductModel>>> Get() => Ok(await repositorysitory.GetAllAsync());

        [HttpGet("Category")]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAllCategory() => Ok(await repositorysitory.GetAllCategoryAsync());
        [HttpPost("AddCatagory")]
        public async Task<IActionResult> CreateCatagory([FromBody] CreateCategoryDto dto)
        {
            try
            {
                var id = await repositorysitory.AddCatagoryAsync(dto);
                return CreatedAtAction(nameof(GetCatagoryById), new { id }, new { id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("move")]
        public async Task<IActionResult> MoveCatagory([FromBody] MoveCategoryDto dto)
        {
            try
            {
                await repositorysitory.MoveCatagoryAsync(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("tree")]
        public async Task<IActionResult> CatagoryTree()
        {
            var json = await repositorysitory.GetCatagoryTreeJsonAsync();
            return Content(json, "application/json");
        }

        [HttpGet("children")]
        public async Task<IActionResult> CatagoryChildren([FromQuery] long? parentId)
        {
            var list = await repositorysitory.GetCatagoryChildrenAsync(parentId);
            return Ok(list);
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetCatagoryById(long id)
        {
            var item = await repositorysitory.GetCatagoryByIdAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }
        [HttpGet("GetCatagory/{id}")]
        public async Task<ActionResult<ProductModel>> GetCatagory(int id)
        {
            var prod = await repositorysitory.GetByIdAsync(id);
            if (prod == null) return NotFound();
            return Ok(prod);
        }

        [HttpPost("AddProduct")]
        public async Task<ActionResult<ProductModels>> AddProducts([FromForm] ProductModels dto)
        {
            var companyIdClaim = User.FindFirst("company_id");
            if (companyIdClaim == null || string.IsNullOrEmpty(companyIdClaim.Value))
                return Unauthorized("Company information not found for this user");

            int companyId = int.Parse(companyIdClaim.Value);

            // 🔹 Get the email of the logged-in user from JWT claims
            string userEmail = User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

            // 🔹 Handle image upload
            string imageFileName = null;
            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                var uploads = Path.Combine(Directory.GetCurrentDirectory(), "UploadedImages");
                if (!Directory.Exists(uploads))
                    Directory.CreateDirectory(uploads);

                imageFileName = $"{Guid.NewGuid()}_{dto.ImageFile.FileName}";
                var filePath = Path.Combine(uploads, imageFileName);
                using var stream = new FileStream(filePath, FileMode.Create);
                await dto.ImageFile.CopyToAsync(stream);
            }

            // 🔹 Map DTO to ProductModel
            ProductModel product = moduleToCommon.Map<ProductModel>(dto);
            product.ImageName = imageFileName;

            // 🔹 Assign JWT info and defaults
            product.CompanyId = companyId;
            product.CreatedBy = userEmail;
            product.Status = "Pending";  // Set status as pending by default

            // 🔹 Insert product
            try
            {
                product.Id = await repositorysitory.CreateAsync(product);
            }
            catch (Exception ex)
            {
                // Optional: handle exception gracefully
                return BadRequest($"Error creating product: {ex.Message}");
            }

            return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromForm] ProductModels dto)
        {
                var product = await repositorysitory.GetByIdAsync(id);
                if (product == null) return NotFound();

                if (dto.ImageFile != null && dto.ImageFile.Length > 0)
                {
                    var uploads = Path.Combine(Directory.GetCurrentDirectory(), "UploadedImages");
                    if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

                    var imageFileName = $"{Guid.NewGuid()}_{dto.ImageFile.FileName}";
                    var filePath = Path.Combine(uploads, imageFileName);
                    using (var stream = new FileStream(filePath, FileMode.Create))
                        await dto.ImageFile.CopyToAsync(stream);

                    product.ImageName = imageFileName;
                }

                // Update other fields
                product.Sku = dto.Sku; product.Name = dto.Name;
                product.Description = dto.Description; // etc.
                product.UpdatedAt = DateTime.UtcNow;

                await repositorysitory.UpdateAsync(product);
                return NoContent();
            }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await repositorysitory.DeleteAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
        [HttpPost("ApproveProduct/{id}")]
        public async Task<IActionResult> ApproveProduct(
    int id,
    [FromBody] ProductDecisionRequest request)
        {
            var email =
                User.FindFirstValue(ClaimTypes.Email)
                ?? User.FindFirstValue("email");

            if (string.IsNullOrEmpty(email))
                return Unauthorized();

            var companyClaim =
                User.FindFirstValue("company_id")
                ?? User.FindFirstValue("CompanyId");

            if (!int.TryParse(companyClaim, out int companyId))
                return Unauthorized(new { error = "Invalid CompanyId claim" });

            if (_db.State != ConnectionState.Open)
                _db.Open();

            using var tx = _db.BeginTransaction();

            try
            {
                var product = await repositorysitory.GetByIdAsync(id, tx);

                if (request.Action == "Approved")
                {
                    await repositorysitory.ApproveProductAsync(
                        id,
                        email,
                        tx
                    );

                    await repositorysitory.AddProductCreditAsync(
                        companyId,
                        product.Id,
                        request.Remarks ?? "Approved",
                        tx
                    );
                }
                else if (request.Action == "Rejected")
                {
                    await repositorysitory.RejectProductAsync(
                        id,
                        email,
                        tx
                    );

                    await repositorysitory.InsertRejectNoteAsync(
                        companyId,
                        product.Id,
                        email,
                        request.Remarks ?? "Rejected",
                        tx
                    );
                }
                else
                {
                    return BadRequest("Invalid action. Use Approve or Reject.");
                }

                tx.Commit();

                return Ok(new
                {
                    productId = id,
                    action = request.Action
                });
            }
            catch (Exception ex)
            {
                tx.Rollback();
                return StatusCode(500, new
                {
                    error = "Operation failed",
                    details = ex.Message
                });
            }
        }
    }
}
