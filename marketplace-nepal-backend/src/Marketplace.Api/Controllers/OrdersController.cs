using Dapper;
using Marketplace.Api.Services.Order;
using Marketplace.Model.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;

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
        [HttpGet("seller-requests/{sellerCompanyId}")]
        public async Task<IActionResult> GetSellerRequests(long sellerCompanyId)
        {
            try
            {
                var items = await _orderService.GetSellerRequestsAsync(sellerCompanyId);
                return Ok(new { success = true, data = items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        [HttpPost("submit-bulk-quote")]
        public async Task<IActionResult> SubmitBulkQuote([FromBody] SubmitBulkQuoteRequest req)
        {
            try
            {
                // Fail-safe check preventing empty UI selections from crashing the database
                if (req == null || req.Items == null || !req.Items.Any())
                    return BadRequest("Invalid bulk quote data. You must select at least one item.");

                await _orderService.SubmitBulkQuoteAsync(req);

                return Ok(new { success = true, message = "Bulk Quotation Sent Successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        [HttpGet("sent-quotations/{sellerCompanyId}")]
        public async Task<IActionResult> GetSentQuotations(long sellerCompanyId)
        {
            try
            {
                var items = await _orderService.GetSentQuotationsAsync(sellerCompanyId);
                return Ok(new { success = true, data = items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        [HttpGet("buyer-dashboard/{buyerCompanyId}")]
        public async Task<IActionResult> GetBuyerDashboard(long buyerCompanyId)
        
        {
            try
            {
                var dashboard = await _orderService.GetBuyerQuotationsAsync(buyerCompanyId);
                return Ok(new { success = true, data = dashboard });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        [HttpPost("buyer-approve-quote/{quoteId}/{buyerCompanyId}")]
        public async Task<IActionResult> ApproveQuote(long quoteId, long buyerCompanyId)
        {
            try
            {

                await _orderService.ApproveQuoteAsync(quoteId, buyerCompanyId);
                return Ok(new { success = true });
            }
            catch (Exception ex) { return StatusCode(500, ex.Message); }
        }
        [HttpPost("buyer-reject-quote/{quoteId}")]
        public async Task<IActionResult> RejectQuote(long quoteId)
        {
            try
            {
                await _orderService.RejectQuoteAsync(quoteId);
                return Ok(new { success = true });
            }
            catch (Exception ex) { return StatusCode(500, ex.Message); }
        }
        [HttpGet("seller-confirmed/{sellerCompanyId}")]
        public async Task<IActionResult> GetSellerConfirmedOrders(long sellerCompanyId)
        {
            try
            {
                var items = await _orderService.GetSellerConfirmedOrdersAsync(sellerCompanyId);

                // This cleanly wraps the array for your Angular `res.data`
                return Ok(new { success = true, data = items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("update-status/{orderId}/{status}")]
        public async Task<IActionResult> UpdateOrderStatus(long orderId, string status)
        {
            try
            {
                // Fail-safe check
                if (string.IsNullOrWhiteSpace(status))
                    return BadRequest(new { success = false, message = "Status cannot be empty" });

                // Executes the manual update
                await _orderService.UpdateOrderStatusTrackAsync(orderId, status);

                return Ok(new { success = true, message = "Order Status Updated" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

    }
}

