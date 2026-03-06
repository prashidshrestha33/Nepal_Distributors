using Marketpalce.Repository.Repositories.ProductRepo;
using Marketplace.Api.Models;
using Marketplace.Api.Services.Helper;
using Marketplace.Model.Models;
using Marketplace.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Security.Claims;
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

        [HttpGet("GetAllCategorybyparentid")]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAllCategorybyparentid([FromQuery] int parentId) => Ok(await repositorysitory.GetparentChild( parentId));
        [HttpPost("AddCatagory")]
        public async Task<IActionResult> CreateCatagory([FromForm] CreateCategoryDto dto)
        {

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Validation failed", errors });
            }
            
            try
            {
                string? imageUrl = null;

                if (dto.Image != null && dto.Image.Length > 0)
                {
                    var uploads = Path.Combine(Directory.GetCurrentDirectory(), "UploadedImages");

                    if (!Directory.Exists(uploads))
                        Directory.CreateDirectory(uploads);

                    var fileName = $"{Guid.NewGuid()}_{dto.Image.FileName}";
                    var filePath = Path.Combine(uploads, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.Image.CopyToAsync(stream);
                    }

                    imageUrl = fileName;
                }

                var id = await repositorysitory.AddCatagoryAsync(dto, imageUrl);

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
        public async Task<IActionResult> AddProducts([FromForm] ProductModels dto)
        {
            var companyIdClaim = User.FindFirst("company_id");
            if (companyIdClaim == null)
                return Unauthorized();

            int companyId = int.Parse(companyIdClaim.Value);
            string userEmail = User?.Claims
                .FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

            // 🔹 Create product first
            ProductModel product = new ProductModel
            {
                Name = dto.Name,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                BrandId = dto.BrandId,
                ManufacturerId = dto.ManufacturerId,
                Rate = dto.Rate,
                CompanyId = companyId,
                CreatedBy = userEmail,
                Status = "Pending"
            };

            product.Id = await repositorysitory.CreateAsync(product);

            // 🔹 Handle Multiple Images
            try
            {
                if (dto.ImageFiles != null && dto.ImageFiles.Count > 0)
                {
                    var uploads = Path.Combine(Directory.GetCurrentDirectory(), "UploadedImages");

                    if (!Directory.Exists(uploads))
                        Directory.CreateDirectory(uploads);

                    var imageList = new List<ProductImageModel>();

                    for (int i = 0; i < dto.ImageFiles.Count; i++)
                    {
                        var file = dto.ImageFiles[i];

                        if (file.Length <= 0) continue;

                        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                        var filePath = Path.Combine(uploads, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        imageList.Add(new ProductImageModel
                        {
                            ProductId = product.Id,
                            ImageName = fileName,
                            IsDefault = dto.DefaultImageIndex == i
                        });
                    }

                    await repositorysitory.InsertProductImagesAsync(product.Id, imageList);
                }
            }
            catch (Exception ex)
            {

                throw;
            }

            return Ok(product);
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromForm] ProductModels dto)
        {
            var product = await repositorysitory.GetByIdAsync(id);
            if (product == null) return NotFound();

            product.Name = dto.Name;
            product.Description = dto.Description;
            product.CategoryId = dto.CategoryId;
            product.BrandId = dto.BrandId;
            product.ManufacturerId = dto.ManufacturerId;
            product.Rate = dto.Rate;
            product.UpdatedAt = DateTime.UtcNow;

            await repositorysitory.UpdateAsync(product);

            // 🔹 Handle image deletions if any
            if (!string.IsNullOrEmpty(dto.ImageIdsToDelete))
            {
                var imageIdsToDelete = JsonConvert.DeserializeObject<List<int>>(dto.ImageIdsToDelete);
                if (imageIdsToDelete.Count > 0)
                {
                    // Delete the images from the database
                    await repositorysitory.DeleteProductImagesByIdsAsync(id, imageIdsToDelete);
                }
            }

            // 🔹 Handle new image uploads if any
            if (dto.ImageFiles != null && dto.ImageFiles.Count > 0)
            {
                var uploads = Path.Combine(Directory.GetCurrentDirectory(), "UploadedImages");
                if (!Directory.Exists(uploads))
                    Directory.CreateDirectory(uploads);

                var imageList = new List<ProductImageModel>();

                for (int i = 0; i < dto.ImageFiles.Count; i++)
                {
                    var file = dto.ImageFiles[i];
                    if (file.Length <= 0) continue;

                    var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                    var filePath = Path.Combine(uploads, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    imageList.Add(new ProductImageModel
                    {
                        ProductId = id,
                        ImageName = fileName,
                        IsDefault = dto.DefaultImageIndex == i
                    });
                }

                // Insert new images into the database
                await repositorysitory.InsertProductImagesAsync(id, imageList);
            }

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
        [HttpGet("search")]
        public async Task<IActionResult> SearchProducts([FromQuery] string? categoryIds,[FromQuery] string? keyword)
        {
            var companyIdClaim = HttpContext.User.GetClaimValue("company_id");
            long? companyId = null;
            if (!string.IsNullOrWhiteSpace(companyIdClaim) && long.TryParse(companyIdClaim, out var parsedId))
            {
                companyId = parsedId;
            }

            var data = await repositorysitory.SearchProductsAsync(categoryIds, keyword, companyId);

            return Ok(new
            {
                success = true,
                count = data.Count(),
                data
            });
        }
    }
}
