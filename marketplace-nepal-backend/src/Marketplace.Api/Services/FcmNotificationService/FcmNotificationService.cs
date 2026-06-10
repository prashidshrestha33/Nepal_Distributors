using FirebaseAdmin.Messaging;

namespace Marketplace.Api.Services.FcmNotificationService
{
    public class FcmNotificationService : IFcmNotificationService
    {
        public async Task<string> SendToUserAsync(
            string fcmToken,
            string title,
            string body,
            Dictionary<string, string>? data = null)
        {
            var message = new Message()
            {
                Token = fcmToken,
                Notification = new Notification
                {
                    Title = title,
                    Body = body
                },
                Data = data ?? new Dictionary<string, string>()
            };

            return await FirebaseMessaging.DefaultInstance.SendAsync(message);
        }
        public async Task<string> SendNewMessageNotificationAsync(
            string fcmToken,
            string senderName,
            string messagePreview)
        {
            var data = new Dictionary<string, string>
        {
            { "type", "chat" },
            { "sender", senderName }
        };

            return await SendToUserAsync(
                fcmToken,
                $"New message from {senderName}",
                messagePreview,
                data
            );
        }

        public async Task<string> SendOrderNotificationAsync(
            string fcmToken,
            string orderId,
            string orderNumber)
        {
            var data = new Dictionary<string, string>
            {
                { "type", "order" },
                { "orderId", orderId },
                { "orderNumber", orderNumber }
            };

            return await SendToUserAsync(
                fcmToken,
                "New Order",
                $"Order #{orderNumber} has been placed for products in your category.",
                data
            );
        }
    }

}
