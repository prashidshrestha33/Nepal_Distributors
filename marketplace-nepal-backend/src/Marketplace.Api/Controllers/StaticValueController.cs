using Marketpalce.Repository.Repositories.StaticValueReop;
using Marketplace.Api.Models;
using Marketplace.Api.Services.Helper;
using Marketplace.Model.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Azure.Core.HttpHeader;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // require auth for all actions in this controller
    public class StaticValueController : ControllerBase
    {
        private readonly IStaticValueRepository _repo;
        private readonly ModuleToCommon _moduleToCommon = new ModuleToCommon(); 
        private ModuleToCommon moduleToCommon = new ModuleToCommon();

        // Prefer depending on the interface (IStaticValueRepository) so DI can resolve it.
        public StaticValueController(IStaticValueRepository repo)
        {
            _repo = repo ?? throw new ArgumentNullException(nameof(repo));
        }

        // CREATE CATALOG
        [HttpPost("CreateCatalog")]
        public async Task<IActionResult> CreateCatalog([FromBody] StaticValueCatalogModel req)
        {
            StaticValueCatalog item = _moduleToCommon.Map<StaticValueCatalog>(req);
            if (item == null || string.IsNullOrWhiteSpace(item.CatalogName))
                return BadRequest("Invalid data.");

            long success = await _repo.CreateCatalogAsync(item);
            if (success > 0)
                return CreatedAtAction(nameof(GetCatalog), new { key = success }, item);

            return Conflict("A record with that key may already exist.");
        }

        // READ SINGLE CATALOG
        // Route uses {key} so parameter name should match (or use [FromRoute(Name="key")])
        [HttpGet("GetCatalog/{key:long}")]
        public async Task<ActionResult<StaticValueCatalog>> GetCatalog(long key)
        {
            var item = await _repo.GetCatalogAsync(key);
            if (item == null) return NotFound();
            return Ok(item);
        }

        // READ ALL CATALOGS
        [HttpGet("GetAllCatalog")]
        public async Task<ActionResult<IEnumerable<StaticValueCatalog>>> GetAllCatalog()
        {
            var items = await _repo.ListAllCatalogAsync();
            return Ok(items);
        }

        // UPDATE CATALOG
        [HttpPut("UpdateCatalog/{id:long}")]
        public async Task<IActionResult> UpdateCatalog( [FromBody] StaticValueCatalog req)
        {
            if (req == null)
                return BadRequest("Key mismatch or invalid data.");

            var success = await _repo.UpdateCatalogAsync(req);
            if (success) return NoContent();
            return NotFound();
        }

        // DELETE CATALOG
        [HttpDelete("DeleteCatalog/{key:long}")]
        public async Task<IActionResult> DeleteCatalog(long key)
        {
            var success = await _repo.DeleteCatalogAsync(key);
            if (success) return NoContent();
            return NotFound();
        }

        // CREATE STATIC VALUE
        [HttpPost("AddStaticValue")]
        public async Task<IActionResult> Create([FromBody] StaticValueModel item)
        {
             if (item == null || string.IsNullOrWhiteSpace(item.StaticValueKey))
                return BadRequest("Invalid data.");
            StaticValue req = _moduleToCommon.Map<StaticValue>(item);
            var success = await _repo.CreateAsync(req);
            if (success)
                return CreatedAtAction(nameof(GetStaticValue), new { key = item.StaticValueKey }, item);

            return Conflict("A record with that key may already exist.");
        }

        // READ SINGLE STATIC VALUE
        [HttpGet("GetStaticValue")]
        public async Task<ActionResult<StaticValue>> GetStaticValue(string staticId=null,string catalogId=null,string key = null)
        {
            StaticValueFilter filter = new StaticValueFilter
            {
                staticId = staticId,
                catalogId = catalogId,
                key = key
            };
            var item = await _repo.GetAsync(filter);
            if (item == null) return NotFound();
            return Ok(item);
        }

        // READ ALL STATIC VALUES
        [HttpGet("GetStaticValueAll/{catagoryid}")]
        public async Task<ActionResult<IEnumerable<StaticValue>>> GetStaticValueAll(string catagoryid)
        {
            var items = await _repo.ListAllAsync(catagoryid);
            return Ok(items);
        }

        // UPDATE STATIC VALUE
        [HttpPut("UpdateStaticValue")]
        public async Task<IActionResult> UpdateStaticValue([FromBody] StaticValueModel item)
        {
            if (item == null || item.StaticValueKey != item.StaticValueKey)
                return BadRequest("Key mismatch or invalid data.");
            StaticValue req = _moduleToCommon.Map<StaticValue>(item);
            var success = await _repo.UpdateAsync(req);
            if (success) return NoContent();
            return NotFound();
        }

        // DELETE STATIC VALUE
        [HttpDelete("{key}")]
        public async Task<IActionResult> DeleteStaticValue(string key)
        {
            var success = await _repo.DeleteAsync(key);
            if (success) return NoContent();
            return NotFound();
        }
    }
}