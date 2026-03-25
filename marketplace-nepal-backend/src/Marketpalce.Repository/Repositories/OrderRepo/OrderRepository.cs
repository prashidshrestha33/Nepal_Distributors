using Dapper;
using Marketplace.Model.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories.OrderRepo
{
    public class OrderRepository : IOrderRepository
    {
        private readonly IDbConnection _db;
        public OrderRepository(IDbConnection db)
        {
            _db = db;
        }
        public async Task<IEnumerable<OrderModel>> GetOrdersAsync(long? buyerCompanyId = null, long? sellerCompanyId = null, string? status = null, DateTime? fromDate = null, DateTime? toDate = null)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@Action", "GET_LIST");
            parameters.Add("@BuyerCompanyId", buyerCompanyId);
            parameters.Add("@SellerCompanyId", sellerCompanyId);
            parameters.Add("@Status", status);
            parameters.Add("@FromDate", fromDate);
            parameters.Add("@ToDate", toDate);
            return await _db.QueryAsync<OrderModel>(
                "dbo.sp_ManageOrderRecords",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }
        public async Task<OrderDetailsDto> GetOrderDetailsAsync(long orderId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@Action", "GET_DETAILS");
            parameters.Add("@OrderId", orderId);
            // Fetch Multiple Result Sets since our SP returns Header first, then Items
            using var multi = await _db.QueryMultipleAsync(
                "dbo.sp_ManageOrderRecords",
                parameters,
                commandType: CommandType.StoredProcedure
            );
            var result = new OrderDetailsDto
            {
                // First Result Set (Header)
                Order = await multi.ReadSingleOrDefaultAsync<OrderModel>(),

                // Second Result Set (Items)
                Items = (await multi.ReadAsync<OrderItemModel>()).ToList()
            };
            return result;
        }
        public async Task<long> CreateOrderAsync(OrderRequestDto request)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@Action", "CREATE");
            parameters.Add("@OrderNumber", request.OrderNumber);
            parameters.Add("@BuyerCompanyId", request.BuyerCompanyId);
            parameters.Add("@CreatedBy", request.CreatedBy);
            parameters.Add("@Status", request.Status);
            parameters.Add("@RequiredByDate", request.RequiredByDate);
            parameters.Add("@ShippingAddress", request.ShippingAddress);
            parameters.Add("@ShippingCharge", request.ShippingCharge);
            parameters.Add("@VatAmount", request.VatAmount);
            parameters.Add("@GrandTotal", request.GrandTotal);
            parameters.Add("@Remarks", request.Remarks);
            // Serialize Items list to JSON string so SQL OPENJSON can read it
            string? itemsJson = request.Items != null && request.Items.Any()
                ? JsonSerializer.Serialize(request.Items)
                : null;

            parameters.Add("@OrderItemsJSON", itemsJson);
            // The procedure returns the newly inserted ID
            return await _db.QuerySingleAsync<long>(
                "dbo.sp_ManageOrderRecords",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }
        public async Task<long> UpdateOrderAsync(long orderId, OrderRequestDto request)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@Action", "UPDATE");
            parameters.Add("@OrderId", orderId);
            parameters.Add("@BuyerCompanyId", request.BuyerCompanyId);
            parameters.Add("@SellerCompanyId", request.SellerCompanyId);
            parameters.Add("@Status", request.Status);
            parameters.Add("@RequiredByDate", request.RequiredByDate);
            parameters.Add("@ShippingAddress", request.ShippingAddress);
            parameters.Add("@ShippingCharge", request.ShippingCharge);
            parameters.Add("@VatAmount", request.VatAmount);
            parameters.Add("@GrandTotal", request.GrandTotal);
            parameters.Add("@Remarks", request.Remarks);
            string? itemsJson = request.Items != null && request.Items.Any()
                ? JsonSerializer.Serialize(request.Items)
                : null;

            parameters.Add("@OrderItemsJSON", itemsJson);
            // The procedure returns the updated ID
            return await _db.QuerySingleAsync<long>(
                "dbo.sp_ManageOrderRecords",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }
        public async Task<long> DeleteOrderAsync(long orderId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@Action", "DELETE");
            parameters.Add("@OrderId", orderId);
            return await _db.QuerySingleAsync<long>(
                "dbo.sp_ManageOrderRecords",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }
        public async Task<IEnumerable<QuotationRequestItemDto>> GetSellerRequestsAsync(long sellerCompanyId)
        {
            return await _db.QueryAsync<QuotationRequestItemDto>(
                "dbo.sp_GetQuotationRequests",
                new { SellerCompanyId = sellerCompanyId },
                commandType: CommandType.StoredProcedure);
        }
        public async Task<long> SubmitQuoteAsync(SubmitQuoteRequest req)
        {
            var p = new DynamicParameters();
            p.Add("@OrderId", req.OrderId);
            p.Add("@OrderItemId", req.OrderItemId);
            p.Add("@QuotedBy", req.QuotedBy);
            p.Add("@ProductId", req.ProductId);
            p.Add("@Quantity", req.Quantity);
            p.Add("@UnitRate", req.UnitRate);
            p.Add("@DeliveryCharge", req.DeliveryCharge);
            p.Add("@Notes", req.Notes);
            // Execute SP and grab the NewQuoteId returned via SCOPE_IDENTITY
            return await _db.QuerySingleAsync<long>(
                "dbo.sp_SubmitQuotation",
                p,
                commandType: CommandType.StoredProcedure);
        }
        public async Task<bool> SubmitBulkQuoteAsync(SubmitBulkQuoteRequest req)
        {
            var p = new DynamicParameters();
            p.Add("@QuotedBy", req.QuotedBy);
            p.Add("@DeliveryCharge", req.DeliveryCharge);

            // Safely handles null text inputs
            p.Add("@Notes", req.Notes ?? "");

            // Serializes the complex array securely into a flat string for SQL
            p.Add("@ItemsJSON", System.Text.Json.JsonSerializer.Serialize(req.Items));

            // Execute the Bulk insertion script!
            await _db.ExecuteAsync("dbo.sp_SubmitBulkQuotation", p, commandType: CommandType.StoredProcedure);

            return true;
        }
        public async Task<IEnumerable<SentQuotationDto>> GetSentQuotationsAsync(long sellerCompanyId)
        {
            // Execute our shiny new Stored Procedure and perfectly map it to the DTO
            return await _db.QueryAsync<SentQuotationDto>(
                "dbo.sp_GetSentQuotations",
                new { SellerCompanyId = sellerCompanyId },
                commandType: CommandType.StoredProcedure
            );
        }
        public async Task<BuyerQuotationDashboardDto> GetBuyerQuotationsAsync(long buyerCompanyId)
        {
            using var multi = await _db.QueryMultipleAsync(
                "dbo.sp_GetBuyerQuotations",
                new { BuyerCompanyId = buyerCompanyId },
                commandType: CommandType.StoredProcedure);

            var dashboard = new BuyerQuotationDashboardDto();

            // Grabs ResultSet 1 (Anonymous 24HR Inbox sorted by Best Price)
            dashboard.Inbox = (await multi.ReadAsync<SentQuotationDto>()).ToList();

            // Grabs ResultSet 2 (History)
            dashboard.History = (await multi.ReadAsync<SentQuotationDto>()).ToList();

            return dashboard;
        }
        public async Task<dynamic> ApproveQuoteAsync(long quoteId, long buyerCompanyId)
        {
                var p = new DynamicParameters();
                p.Add("@QuoteId", quoteId);
                p.Add("@BuyerCompanyId", buyerCompanyId);

                return await _db.ExecuteAsync("dbo.sp_ApproveQuotation", p, commandType: CommandType.StoredProcedure);
        }
        public async Task<dynamic> RejectQuoteAsync(long quoteId)
        {
                return await _db.ExecuteAsync("dbo.sp_RejectQuotation", new { QuoteId = quoteId }, commandType: CommandType.StoredProcedure);
        }
        public async Task<IEnumerable<SellerConfirmedOrderDto>> GetSellerConfirmedOrdersAsync(long sellerCompanyId)
        {
            var lookup = new Dictionary<long, SellerConfirmedOrderDto>();

            await _db.QueryAsync<SellerConfirmedOrderDto, SellerConfirmedOrderItemDto, SellerConfirmedOrderDto>(
                "dbo.sp_GetSellerConfirmedOrders",
                (order, item) =>
                {
                    // If this Master Order is not yet in our dictionary, add it!
                    if (!lookup.TryGetValue(order.OrderId, out var currentOrder))
                    {
                        currentOrder = order;
                        currentOrder.Items = new List<SellerConfirmedOrderItemDto>();
                        lookup.Add(currentOrder.OrderId, currentOrder);
                    }

                    // Append the child item cleanly
                    if (item != null && item.ItemId > 0)
                    {
                        currentOrder.Items.Add(item);
                    }

                    return currentOrder;
                },
                new { SellerCompanyId = sellerCompanyId },
                splitOn: "ItemId", // 👈 Crucial! This is where the SQL columns split from Master to Child Item
                commandType: CommandType.StoredProcedure
            );

            return lookup.Values;
        }

        public async Task<bool> UpdateOrderStatusTrackAsync(long orderId, string status)
        {
            var p = new DynamicParameters();
            p.Add("@OrderId", orderId);

            // Safely trims or decodes the status string just in case
            p.Add("@NewStatus", status?.Trim() ?? "");

            await _db.ExecuteAsync("dbo.sp_UpdateOrderStatus", p, commandType: CommandType.StoredProcedure);
            return true;
        }

    }
}
