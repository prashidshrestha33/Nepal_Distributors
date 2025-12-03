using Google.Apis.Auth;
using System.Threading.Tasks;

namespace Marketplace.Api.Services
{
    public interface IGoogleTokenVerifier
    {
        Task<GoogleJsonWebSignature.Payload> VerifyAsync(string idToken);
    }
}