using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace Marketplace.Api.Services
{
    public class GoogleTokenVerifier : IGoogleTokenVerifier
    {
        private readonly IConfiguration _config;
        public GoogleTokenVerifier(IConfiguration config) => _config = config;

        public async Task<GoogleJsonWebSignature.Payload> VerifyAsync(string idToken)
        {
            var clientId = _config.GetSection("Google")["ClientId"];
            var validationSettings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = string.IsNullOrEmpty(clientId) ? null : new[] { clientId }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, validationSettings);
            return payload;
        }
    }
}