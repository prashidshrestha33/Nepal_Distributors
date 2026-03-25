using Dapper;
using Marketpalce.Repository.Repositories.OrderRepo;
using Marketplace.Api.Models;
using Marketplace.Model.Models;
using System.Collections.Generic;
using System.Data;
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
        Task<IEnumerable<QuotationRequestItemDto>> GetSellerRequestsAsync(long sellerCompanyId);
        Task<long> SubmitQuoteAsync(SubmitQuoteRequest req);
        Task<bool> SubmitBulkQuoteAsync(SubmitBulkQuoteRequest req);
        Task<IEnumerable<SentQuotationDto>> GetSentQuotationsAsync(long sellerCompanyId);
        Task<BuyerQuotationDashboardDto> GetBuyerQuotationsAsync(long buyerCompanyId);
        Task<dynamic> ApproveQuoteAsync(long quoteId, long buyerCompanyId);
        Task<dynamic> RejectQuoteAsync(long quoteId);
        Task<IEnumerable<SellerConfirmedOrderDto>> GetSellerConfirmedOrdersAsync(long sellerCompanyId);
        Task<bool> UpdateOrderStatusTrackAsync(long orderId, string status);

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
        public async Task<IEnumerable<QuotationRequestItemDto>> GetSellerRequestsAsync(long sellerCompanyId)
        {
            return await _repository.GetSellerRequestsAsync(sellerCompanyId);
        }
        public async Task<long> SubmitQuoteAsync(SubmitQuoteRequest req)
        {
            return await _repository.SubmitQuoteAsync(req);
        }
        public async Task<bool> SubmitBulkQuoteAsync(SubmitBulkQuoteRequest req)
        {
            return await _repository.SubmitBulkQuoteAsync(req);
        }
        public async Task<IEnumerable<SentQuotationDto>> GetSentQuotationsAsync(long sellerCompanyId)
        {
            return await _repository.GetSentQuotationsAsync(sellerCompanyId);
        }
        public async Task<BuyerQuotationDashboardDto> GetBuyerQuotationsAsync(long buyerCompanyId)
        {
            return await _repository.GetBuyerQuotationsAsync(buyerCompanyId);
        }
        public async Task<dynamic> ApproveQuoteAsync(long quoteId, long buyerCompanyId)
        {
            return await _repository.ApproveQuoteAsync(quoteId, buyerCompanyId);
        }
        public async Task<dynamic> RejectQuoteAsync(long quoteId)
        {

            return await _repository.RejectQuoteAsync(quoteId);
        }
        public async Task<IEnumerable<SellerConfirmedOrderDto>> GetSellerConfirmedOrdersAsync(long sellerCompanyId)
        {
            return await _repository.GetSellerConfirmedOrdersAsync(sellerCompanyId);
        }

        public async Task<bool> UpdateOrderStatusTrackAsync(long orderId, string status)
        {
            return await _repository.UpdateOrderStatusTrackAsync(orderId, status);
        }


    }
}
