using Marketpalce.Repository.Repositories.UserReop;
using Marketplace.Api.Services.FcmNotificationService;

namespace Marketplace.Api.Services.Helper
{
    public class ChatService
    {
        private readonly IFcmNotificationService _fcm;
        private readonly IUserRepository _tokenRepo;

        public ChatService(IFcmNotificationService fcm, IUserRepository tokenRepo)
        {
            _fcm = fcm;
            _tokenRepo = tokenRepo;
        }

        public async Task SendMessageAsync(int senderId, int receiverId, string message)
        {
            // 1️⃣ Save message in DB (your existing logic)
            // SaveMessageToDatabase(...)

            // 2️⃣ Get receiver FCM token
            var token = await _tokenRepo.GetTokenByUserIdAsync(receiverId);

            if (!string.IsNullOrEmpty(token))
            {
                // 3️⃣ Trigger push notification
                await _fcm.SendNewMessageNotificationAsync(
                    token,
                    $"User {senderId}",
                    message.Length > 50 ? message.Substring(0, 50) + "..." : message
                );
            }
        }
    }

}
