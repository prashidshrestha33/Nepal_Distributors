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
    }
}
