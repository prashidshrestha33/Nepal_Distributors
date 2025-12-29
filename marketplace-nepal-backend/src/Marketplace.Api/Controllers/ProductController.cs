using Marketpalce.Repository.Repositories.ProductRepo;
using Marketplace.Api.Models;
using Marketplace.Model.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Threading.Tasks;
namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductRepository repositorysitory;
        private readonly IDbConnection _db;
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
        public async Task<ActionResult<ProductModel>> AddProducts([FromForm] ProductModels dto)
        {
            string imageFileName = null;
            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                var uploads = Path.Combine(Directory.GetCurrentDirectory(), "UploadedImages");
                if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

                imageFileName = $"{Guid.NewGuid()}_{dto.ImageFile.FileName}";
                var filePath = Path.Combine(uploads, imageFileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                    await dto.ImageFile.CopyToAsync(stream);
            }

            var product = new ProductModel
            {
                Sku = dto.Sku,
                Name = dto.Name,
                Description = dto.Description,
                ShortDescription = dto.ShortDescription,
                CategoryId = dto.CategoryId,
                BrandId = dto.BrandId,
                ManufacturerId = dto.ManufacturerId,
                Rate = dto.Rate,
                HsCode = dto.HsCode,
                Status = dto.Status,
                IsFeatured = dto.IsFeatured,
                SeoTitle = dto.SeoTitle,
                SeoDescription = dto.SeoDescription,
                Attributes = dto.Attributes,
                ImageName = imageFileName,
                CreatedBy = dto.CreatedBy,
                CreatedAt = DateTime.UtcNow,
            };
            product.Id = await repositorysitory.CreateAsync(product);
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
        public async Task<IActionResult> ApproveProduct(long id, [FromBody] string? details = null)
        {
            var approvedBy = User?.Identity?.Name ?? "system";
            details ??= "User approved";

            if (_db.State != ConnectionState.Open) _db.Open();
            using var tx = _db.BeginTransaction();
            try
            {
                var product = await repositorysitory.GetCatagoryByIdAsync(id);
                if (product == null)
                    return NotFound(new { error = "product not found." });

                var success = await repositorysitory.ApproveProductAsync(id, approvedBy, details, tx);
                if (!success)
                {
                    tx.Rollback();
                    return StatusCode(500, new { error = "Approval failed." });
                }

                tx.Commit();
                return Ok(new { id });
            }
            catch (Exception ex)
            {
                try { tx.Rollback(); } catch { }
                return StatusCode(500, new { error = "Approval failed", details = ex.Message });
            }
        }
    }
}
