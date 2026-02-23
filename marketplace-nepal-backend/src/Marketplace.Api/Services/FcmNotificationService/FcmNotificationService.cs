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

        // 🔥 Special helper for chat message
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
    }

}
