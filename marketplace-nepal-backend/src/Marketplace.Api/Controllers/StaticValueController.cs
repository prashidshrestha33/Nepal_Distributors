using Marketpalce.Repository.Repositories.StaticValueReop;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // require auth for all actions in this controller
    public class StaticValueController : ControllerBase
    {
        private readonly StaticValueRepository _repo;

        public StaticValueController(StaticValueRepository repo)
        {
            _repo = repo;
        }

        // CREATE
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] StaticValue item)
        {
            if (item == null || string.IsNullOrWhiteSpace(item.StaticValueKey))
                return BadRequest("Invalid data.");

            var success = await _repo.CreateAsync(item.StaticValueKey, item.StaticData);
            if (success)
                return CreatedAtAction(nameof(Get), new { key = item.StaticValueKey }, item);

            return Conflict("A record with that key may already exist.");
        }

        // READ SINGLE
        [HttpGet("{key}")]
        public async Task<ActionResult<StaticValue>> Get(string key)
        {
            var item = await _repo.GetAsync(key);
            if (item == null) return NotFound();
            return item;
        }

        // READ ALL
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StaticValue>>> GetAll()
        {
            var items = await _repo.ListAllAsync();
            return Ok(items);
        }

        // UPDATE
        [HttpPut("{key}")]
        public async Task<IActionResult> Update(string key, [FromBody] StaticValue item)
        {
            if (item == null || key != item.StaticValueKey)
                return BadRequest("Key mismatch or invalid data.");

            var success = await _repo.UpdateAsync(key, item.StaticData);
            if (success) return NoContent();
            return NotFound();
        }

        // DELETE
        [HttpDelete("{key}")]
        public async Task<IActionResult> Delete(string key)
        {
            var success = await _repo.DeleteAsync(key);
            if (success) return NoContent();
            return NotFound();
        }
    }
}
