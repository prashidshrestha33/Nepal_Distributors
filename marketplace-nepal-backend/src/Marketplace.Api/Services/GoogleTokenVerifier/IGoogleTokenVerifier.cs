using Google.Apis.Auth;
using System.Threading.Tasks;

namespace Marketplace.Api.Services.GoogleTokenVerifier
{
    public interface IGoogleTokenVerifier
    {
        Task<GoogleJsonWebSignature.Payload> VerifyAsync(string idToken);
    }
}