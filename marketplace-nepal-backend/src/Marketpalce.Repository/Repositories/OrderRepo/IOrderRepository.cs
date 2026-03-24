using Marketplace.Model.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories.OrderRepo
{
    public interface IOrderRepository
    {
        Task<IEnumerable<OrderModel>> GetOrdersAsync(long? buyerCompanyId = null, long? sellerCompanyId = null, string? status = null, DateTime? fromDate = null, DateTime? toDate = null);
        Task<OrderDetailsDto> GetOrderDetailsAsync(long orderId);
        Task<long> CreateOrderAsync(OrderRequestDto request);
        Task<long> UpdateOrderAsync(long orderId, OrderRequestDto request);
        Task<long> DeleteOrderAsync(long orderId);
    }
}
