using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace Marketplace.Api.Services.FacebookToken
{
    public class FacebookTokenVerifier : IFacebookTokenVerifier
    {
        private readonly IHttpClientFactory _http;
        private readonly IConfiguration _config;

        public FacebookTokenVerifier(IHttpClientFactory http, IConfiguration config)
        {
            _http = http;
            _config = config;
        }

        public async Task<FacebookUserProfile?> VerifyAsync(string accessToken)
        {
            // Call Facebook /me endpoint with fields=id,name,email
            // Example: GET https://graph.facebook.com/me?fields=id,name,email&access_token={token}
            if (string.IsNullOrWhiteSpace(accessToken)) throw new ArgumentException("accessToken required", nameof(accessToken));

            var client = _http.CreateClient("facebook");
            var url = $"me?fields=id,name,email&access_token={Uri.EscapeDataString(accessToken)}";

            var res = await client.GetAsync(url);
            if (!res.IsSuccessStatusCode) return null;

            var json = await res.Content.ReadAsStringAsync();
            // Sample response: { "id":"123", "name":"John Doe", "email":"john@example.com" }
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var profile = new FacebookUserProfile
            {
                Id = root.TryGetProperty("id", out var idEl) ? idEl.GetString() : null,
                Name = root.TryGetProperty("name", out var nameEl) ? nameEl.GetString() : null,
                Email = root.TryGetProperty("email", out var emailEl) ? emailEl.GetString() : null
            };

            return profile;
        }
    }
}