using Marketplace.Api.Models;
using System;
using System.Data;
using System.Threading.Tasks;

namespace Marketplace.Api.Repositories
{
    public interface IUserRepository
    {
        Task<MarketplaceUser?> GetByEmailAsync(string email);

        // Social lookups
        Task<MarketplaceUser?> GetByGoogleIdAsync(string googleId);
        Task<MarketplaceUser?> GetByFacebookIdAsync(string facebookId);

        // Accept optional transaction so caller can save within the same transaction.
        Task<long> CreateAsync(MarketplaceUser user, IDbTransaction? transaction = null);

        Task UpdateLastLoginAsync(long id, DateTimeOffset lastLoginAt);
        Task UpdatePasswordHashAsync(long id, string passwordHash);

        // Link social ids after verifying ownership
        Task LinkGoogleIdAsync(long id, string googleId);
        Task LinkFacebookIdAsync(long id, string facebookId);
    }
}