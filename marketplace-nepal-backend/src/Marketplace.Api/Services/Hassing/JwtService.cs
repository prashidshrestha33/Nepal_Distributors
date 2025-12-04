using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Marketplace.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Marketplace.Api.Services.Hassing
{
    public interface IJwtService
    {
        string GenerateToken(MarketplaceUser user);
    }

    public class JwtService : IJwtService
    {
        private readonly IConfiguration _config;
        public JwtService(IConfiguration config) => _config = config;

        /// <summary>
        /// Generates a JWT token for the specified <see cref="MarketplaceUser"/>.
        /// </summary>
        /// <param name="user">The user for whom to generate the token.</param>
        /// <returns>A JWT token string representing the user.</returns>
        public string GenerateToken(MarketplaceUser user)
        {
            var jwt = _config.GetSection("Jwt");
            var key = jwt["Key"] ?? throw new Exception("Jwt:Key missing");
            var issuer = jwt["Issuer"];
            var audience = jwt["Audience"];
            var lifetimeMinutes = int.Parse(jwt["TokenLifetimeMinutes"] ?? "60");

            var claims = new List<Claim>
            {
                new Claim("company_id", user.CompanyId?.ToString() ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            };

            // Emit role claims properly (one claim per role)
            if (!string.IsNullOrEmpty(user.Role))
            {
                var roles = user.Role.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var r in roles)
                    claims.Add(new Claim("role", r.Trim()));
            }

            var creds = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(issuer, audience, claims, expires: DateTime.UtcNow.AddMinutes(lifetimeMinutes), signingCredentials: creds);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}