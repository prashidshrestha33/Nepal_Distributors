using System.Threading.Tasks;

namespace Marketplace.Api.Services.FacebookToken
{
    public interface IFacebookTokenVerifier
    {
        // Validate access token and return a small profile with Email & Name (email may be null)
        Task<FacebookUserProfile?> VerifyAsync(string accessToken);
    }

    public class FacebookUserProfile
    {
        public string? Id { get; set; }
        public string? Email { get; set; }
        public string? Name { get; set; }
    }
}