using Dapper;
using Marketpalce.Repository.Repositories.OrderRepo;
using Marketplace.Api.Models;
using Marketplace.Model.Models;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Marketplace.Api.Services.FcmNotificationService;
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
        private readonly IFcmNotificationService _fcmService;

        public OrderService(IOrderRepository repository, IFcmNotificationService fcmService)
        {
            _repository = repository;
            _fcmService = fcmService;
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

            var orderId = await _repository.CreateOrderAsync(request);

            // Only notify if status is processing and notification bypass is not explicitly requested
            if (request.Status == "processing" && request.PreventNotification != true)
            {
                await SendFcmNotificationsForOrderAsync(orderId, request.OrderNumber);
            }

            return orderId;
        }

        private async Task SendFcmNotificationsForOrderAsync(long orderId, string orderNumber)
        {
            try
            {
                var recipients = await _repository.GetFcmRecipientsForOrderCategoriesAsync(orderId);
                string orderIdentifier = !string.IsNullOrEmpty(orderNumber) ? orderNumber : orderId.ToString();
                
                foreach (var recipient in recipients)
                {
                    long notificationId = 0;
                    try
                    {
                        // 1. Insert notification with pending status 'p'
                        notificationId = await _repository.InsertNotificationLogAsync(
                            recipient.UserId,
                            recipient.CompanyId,
                            "pn",
                            recipient.FmcToken,
                            "p"
                        );

                        // 2. Send FCM notification
                        await _fcmService.SendOrderNotificationAsync(
                            recipient.FmcToken, 
                            orderId.ToString(), 
                            orderIdentifier
                        );

                        // 3. Update status to sent 's'
                        await _repository.UpdateNotificationLogStatusAsync(notificationId, "s");
                    }
                    catch (System.Exception ex)
                    {
                        // 4. Update status to error 'e' if the log row was created
                        if (notificationId > 0)
                        {
                            try
                            {
                                await _repository.UpdateNotificationLogStatusAsync(notificationId, "e");
                            }
                            catch { }
                        }
                        // Log or ignore individual token notification errors so creation doesn't fail
                        System.Console.WriteLine($"Error sending push notification to token {recipient.FmcToken}: {ex.Message}");
                    }
                }
            }
            catch (System.Exception ex)
            {
                // Ensure overall notification failure doesn't fail order creation
                System.Console.WriteLine($"Error retrieving FCM tokens or sending notifications: {ex.Message}");
            }
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
            var success = await _repository.UpdateOrderStatusTrackAsync(orderId, status);

            // If the status is updated to 'processing', manually release notifications to sellers
            if (success && string.Equals(status, "processing", System.StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var orderDetails = await _repository.GetOrderDetailsAsync(orderId);
                    if (orderDetails?.Order != null)
                    {
                        await SendFcmNotificationsForOrderAsync(orderId, orderDetails.Order.OrderNumber);
                    }
                }
                catch (System.Exception ex)
                {
                    System.Console.WriteLine($"Error sending notifications during manual release: {ex.Message}");
                }
            }

            return success;
        }


    }
}
