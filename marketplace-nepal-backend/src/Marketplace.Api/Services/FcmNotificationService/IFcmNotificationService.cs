namespace Marketplace.Api.Services.FcmNotificationService
{
    public interface IFcmNotificationService
    {
        Task<string> SendToUserAsync(string fcmToken, string title, string body, Dictionary<string, string>? data = null);
        Task<string> SendNewMessageNotificationAsync(string fcmToken, string senderName, string messagePreview);
        Task<string> SendOrderNotificationAsync(string fcmToken, string orderId, string orderNumber);

    }
}
