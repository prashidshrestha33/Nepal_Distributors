using Marketplace.Api.Services.Order;
using Marketplace.Model.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Marketplace.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] long? buyerId, [FromQuery] long? sellerId, [FromQuery] string status)
        {
            try
            {
                var orders = await _orderService.GetAllOrdersAsync(buyerId, sellerId, status);
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching orders.", details = ex.Message });
            }
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetWithDetails(long id)
        {
            try
            {
                var orderDetails = await _orderService.GetOrderByIdAsync(id);
                if (orderDetails.Order == null)
                    return NotFound();
                return Ok(orderDetails);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching order details.", details = ex.Message });
            }
        }
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] OrderRequestDto request)
        {
            try
            {
                var newOrderId = await _orderService.CreateOrderAsync(request);
                return CreatedAtAction(nameof(GetWithDetails), new { id = newOrderId }, new { message = "Order Created", orderId = newOrderId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating order.", details = ex.Message });
            }
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] OrderRequestDto request)
        {
            try
            {
                var updatedId = await _orderService.UpdateOrderAsync(id, request);
                return Ok(new { message = "Order Updated", orderId = updatedId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating order.", details = ex.Message });
            }
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            try
            {
                var deletedId = await _orderService.DeleteOrderAsync(id);
                return Ok(new { message = "Order Deleted", orderId = deletedId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting order.", details = ex.Message });
            }
        }
    }
}

