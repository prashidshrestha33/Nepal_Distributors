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

}
