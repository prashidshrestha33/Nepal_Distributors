using Marketplace.Model.Models;
using Marketplace.Models;
using System;
using System.Data;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories.UserReop
{
    public interface IUserRepository
    {
        Task<MarketplaceUser?> GetByEmailAsync(string email = null, string googleId = null, string facebookId = null);
        // Accept optional transaction so caller can save within the same transaction.
        Task<long> CreateAsync(MarketplaceUser user, IDbTransaction? transaction = null);

        Task UpdateLastLoginAsync(long id, DateTimeOffset lastLoginAt);
        Task UpdatePasswordHashAsync(long id, string passwordHash);

        // Link social ids after verifying ownership
        Task LinkGoogleIdAsync(long id, string googleId);
        Task LinkFacebookIdAsync(long id, string facebookId);
        Task<MarketplaceUser?> GetuserByid(string userid);

        Task<List<MarketplaceUser>> GetAllid(long companyid);
        Task<IEnumerable<MarketplaceUser>> GetAllUserAsync();

        Task<MarketplaceUser?> GetByIdAsync(long id);
        Task<bool> UpdateUserAsync(MarketplaceUser user, IDbTransaction? transaction = null);
        Task<bool> ApproveUserAsync(long userId, string approvedBy, string details, IDbTransaction? transaction = null);
        Task UpdateAuthTokenAsync(long userid, string ranno,string email);
        Task<bool> CheckAuthTokenAsync(long userId, string otp);

        Task<bool> CheckOtpAUth(string email, string otp);
        Task<(string? payload, int? isRead, long? userId)> AuthTokenValidation(string token);
        Task UpdatePasswordAsync(long userid, string Passwordhass);
        Task UpdateOtpTokem(string ranno, string email);

    }
}