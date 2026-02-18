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

        [HttpGet("Update/{id:int}")]
        public async Task<IActionResult> GetProductById(int id)
        {
            var item = await repositorysitory.GetByIdAsync(id);
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

        [HttpPost("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromForm] ProductModels dto)
        {
            // Fetch the existing product from the repository
            var product = await repositorysitory.GetByIdAsync(id);
            if (product == null) return NotFound(); // If the product doesn't exist, return NotFound

            // Process the new image if provided
            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                var uploads = Path.Combine(Directory.GetCurrentDirectory(), "UploadedImages");
                if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads); // Create directory if it doesn't exist

                // Generate a new filename for the image
                var imageFileName = $"{Guid.NewGuid()}_{dto.ImageFile.FileName}";
                var filePath = Path.Combine(uploads, imageFileName);

                // Save the file to the server
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ImageFile.CopyToAsync(stream);
                }

                // Update the ImageName property in the product object
                product.ImageName = imageFileName;
            }

            // Update non-nullable fields (Sku, Name, Description)
            if (!string.IsNullOrEmpty(dto.Sku)) product.Sku = dto.Sku;
            if (!string.IsNullOrEmpty(dto.Name)) product.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.Description)) product.Description = dto.Description;

            // Update nullable fields if values are provided (Rate, ManufacturerId, BrandId, CategoryId)
            product.Rate = dto.Rate;
            product.ManufacturerId = dto.ManufacturerId;
            product.BrandId = dto.BrandId;
            product.CategoryId = dto.CategoryId;

            // Update optional fields (Status, IsFeatured, HsCode, etc.)
            if (!string.IsNullOrEmpty(dto.Status)) product.Status = dto.Status;
            if (dto.IsFeatured.HasValue) product.IsFeatured = dto.IsFeatured.Value;
            if (!string.IsNullOrEmpty(dto.HsCode)) product.HsCode = dto.HsCode;
            if (!string.IsNullOrEmpty(dto.SeoTitle)) product.SeoTitle = dto.SeoTitle;
            if (!string.IsNullOrEmpty(dto.SeoDescription)) product.SeoDescription = dto.SeoDescription;
            if (!string.IsNullOrEmpty(dto.Attributes)) product.Attributes = dto.Attributes;

            // Set the update timestamp
            product.UpdatedAt = DateTime.UtcNow;

            // Call the UpdateAsync method to update the product in the repository
            var updateSuccess = await repositorysitory.UpdateAsync(product);
            if (!updateSuccess) return StatusCode(500, "Failed to update product.");

            // Optionally, fetch the updated product to return as a response
            product = await repositorysitory.GetByIdAsync(id);

            // Return the updated product object as response
            return Ok(product);
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
