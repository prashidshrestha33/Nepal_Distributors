using Marketpalce.Repository.Repositories.OrderRepo;
using Marketplace.Api.Models;
using Marketplace.Model.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
namespace Marketplace.Api.Services.Order
{
    public interface IOrderService
    {
        Task<IEnumerable<OrderModel>> GetAllOrdersAsync(long? buyerId = null, long? sellerId = null, string status = null);
        Task<OrderDetailsDto> GetOrderByIdAsync(long orderId);
        Task<long> CreateOrderAsync(OrderRequestDto request);
        Task<long> UpdateOrderAsync(long orderId, OrderRequestDto request);
        Task<long> DeleteOrderAsync(long orderId);
    }

    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repository;

        public OrderService(IOrderRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<OrderModel>> GetAllOrdersAsync(long? buyerId = null, long? sellerId = null, string status = null)
        {
            return await _repository.GetOrdersAsync(buyerId, sellerId, status);
        }

        public async Task<OrderDetailsDto> GetOrderByIdAsync(long orderId)
        {
            return await _repository.GetOrderDetailsAsync(orderId);
        }

        public async Task<long> CreateOrderAsync(OrderRequestDto request)
        {
            // Business Logic Check Example
            if (request.GrandTotal < 0)
                throw new System.ArgumentException("Grand Total cannot be negative.");

            return await _repository.CreateOrderAsync(request);
        }

        public async Task<long> UpdateOrderAsync(long orderId, OrderRequestDto request)
        {
            return await _repository.UpdateOrderAsync(orderId, request);
        }

        public async Task<long> DeleteOrderAsync(long orderId)
        {
            return await _repository.DeleteOrderAsync(orderId);
        }
    }
}
