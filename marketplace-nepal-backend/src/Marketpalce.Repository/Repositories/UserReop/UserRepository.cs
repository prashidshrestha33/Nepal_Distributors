using System;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using Marketplace.Models;

namespace Marketpalce.Repository.Repositories.UserReop
{
    public class UserRepository : IUserRepository
    {
        private readonly IDbConnection _db;
        public UserRepository(IDbConnection db) => _db = db;

        public async Task<MarketplaceUser?> GetByEmailAsync(string email = null, string googleId = null, string facebookId = null)
        {
            string sql = @"SELECT TOP (1)
    id AS Id,
    company_id AS CompanyId,
    email AS Email,
    password_hash AS PasswordHash,
    full_name AS FullName,
    phone AS Phone,
    role AS Role,
    status AS Status,
    credits AS Credits,
    tier AS Tier,
    google_id AS GoogleId,
    facebook_id AS FacebookId,
    created_at AS CreatedAt,
    updated_at AS UpdatedAt,
    last_login_at AS LastLoginAt
FROM dbo.users WHERE isnull(approve_fg,'n')='y'";
            if (email != null)
                sql += "AND LOWER(email) = LOWER(@Email);  ";
            else if (googleId != null)
                sql += "AND google_id = @GoogleId; ";
            else if (facebookId != null)
                sql += "AND facebook_id = @FacebookId;";
            return await _db.QueryFirstOrDefaultAsync<MarketplaceUser>(sql, new { Email = email , GoogleId = googleId, FacebookId = facebookId });
        }
        public async Task<long> CreateAsync(MarketplaceUser user, IDbTransaction? transaction = null)
        {
            try
            {
                const string sql = @"
INSERT INTO dbo.users (company_id, email, password_hash, full_name, phone, role, status, credits, tier, google_id, facebook_id, created_at, updated_at)
OUTPUT INSERTED.id
VALUES (@CompanyId, @Email, @PasswordHash, @FullName, @Phone, @Role, @Status, @Credits, @Tier, @GoogleId, @FacebookId, SYSUTCDATETIME(), SYSUTCDATETIME());";

                var id = await _db.QuerySingleAsync<long>(sql, new
                {
                    user.CompanyId,
                    user.Email,
                    user.PasswordHash,
                    user.FullName,
                    user.Phone,
                    user.Role,
                    user.Status,
                    user.Credits,
                    user.Tier,
                    user.GoogleId,
                    user.FacebookId
                }, transaction: transaction);
                return id;
            }
            catch (Exception)
            {
                // preserve previous behavior: return 0 on error (consider throwing/logging in future)
                return 0;
            }
        }

        public async Task UpdateLastLoginAsync(long id, DateTimeOffset lastLoginAt)
        {
            const string sql = "UPDATE dbo.users SET last_login_at = @LastLoginAt, updated_at = SYSUTCDATETIME() WHERE id = @Id";
            await _db.ExecuteAsync(sql, new { Id = id, LastLoginAt = lastLoginAt });
        }

        // Persist new/rehashed password hash
        public async Task UpdatePasswordHashAsync(long id, string passwordHash)
        {
            const string sql = "UPDATE dbo.users SET password_hash = @PasswordHash, updated_at = SYSUTCDATETIME() WHERE id = @Id";
            await _db.ExecuteAsync(sql, new { Id = id, PasswordHash = passwordHash });
        }

        public async Task LinkGoogleIdAsync(long id, string googleId)
        {
            const string sql = "UPDATE dbo.users SET google_id = @GoogleId, updated_at = SYSUTCDATETIME() WHERE id = @Id";
            await _db.ExecuteAsync(sql, new { Id = id, GoogleId = googleId });
        }

        public async Task LinkFacebookIdAsync(long id, string facebookId)
        {
            const string sql = "UPDATE dbo.users SET facebook_id = @FacebookId, updated_at = SYSUTCDATETIME() WHERE id = @Id";
            await _db.ExecuteAsync(sql, new { Id = id, FacebookId = facebookId });
        }
        public async Task<MarketplaceUser?> GetuserByid(string userid)
        {
            string sql = @"SELECT TOP (1) *
            FROM dbo.users WHERE id = @id";
            return await _db.QueryFirstOrDefaultAsync<MarketplaceUser>(sql, new { id = userid });
        }
        public async Task<MarketplaceUser?> GetAllid(string companyid)
        {
            string sql = @"SELECT *
            FROM dbo.users WHERE company_id = @companyid";
            return await _db.QueryFirstOrDefaultAsync<MarketplaceUser>(sql, new { company_id = companyid });
        }
        public async Task<MarketplaceUser?> GetByIdAsync(long id)
        {
            const string sql = "SELECT * FROM dbo.users WHERE id = @Id";
            return await _db.QuerySingleOrDefaultAsync<MarketplaceUser>(sql, new { Id = id });
        }
        public async Task<bool> UpdateUserAsync(MarketplaceUser user, IDbTransaction? transaction = null)
        {
            try
            {
                const string sql = @"
UPDATE dbo.users
SET
    company_id    = @CompanyId,
    email         = @Email,
    password_hash = @PasswordHash,
    full_name     = @FullName,
    phone         = @Phone,
    role          = @Role,
    tier          = @Tier,
    google_id     = @GoogleId,
    facebook_id   = @FacebookId,
    updated_at    = SYSUTCDATETIME()
WHERE
    id = @Id;
";

                var rowsAffected = await _db.ExecuteAsync(sql, new
                {
                    user.CompanyId,
                    user.Email,
                    user.PasswordHash,
                    user.FullName,
                    user.Phone,
                    user.Role,
                    user.Status,
                    user.Credits,
                    user.Tier,
                    user.GoogleId,
                    user.FacebookId,
                    user.Id
                }, transaction: transaction);

                return rowsAffected > 0;
            }
            catch (Exception)
            {
                // preserve previous behavior: return false on error (consider throwing/logging in future)
                return false;
            }
        }
        public async Task<bool> ApproveUserWithLogAsync(long userId, string approvedBy, string details, IDbTransaction? transaction = null)
        {
            try
            {
                // Approve user
                const string approveSql = @"
UPDATE dbo.users
SET
    approve_dt = SYSUTCDATETIME(),
    approve_fg = 1,
    updated_at = SYSUTCDATETIME()
WHERE
    id = @Id;
";

                // Insert log
                const string logSql = @"
INSERT INTO dbo.user_logs (user_id, action, logged_dt, details, performed_by)
VALUES (@UserId, @Action, SYSUTCDATETIME(), @Details, @PerformedBy);
";

                var approveRows = await _db.ExecuteAsync(approveSql, new { Id = userId }, transaction);

                if (approveRows > 0)
                {
                    await _db.ExecuteAsync(logSql, new
                    {
                        UserId = userId,
                        Action = "approve",
                        Details = details,
                        PerformedBy = approvedBy
                    }, transaction);

                    return true;
                }

                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }
        public async Task<bool> ApproveUserAsync(long userId, string approvedBy, string details, IDbTransaction? transaction = null)
        {
            try
            {
                const string approveSql = @"
UPDATE dbo.users
SET
    approve_dt = SYSUTCDATETIME(),
    approve_fg = 1,
    updated_at = SYSUTCDATETIME()
WHERE
    id = @Id;
";

                var approveRows = await _db.ExecuteAsync(approveSql, new { Id = userId }, transaction);

                if (approveRows > 0)
                {
                    await UserLogRepository.LogUserActionAsync(_db, userId, "approveUser", details, approvedBy, transaction);
                    return true;
                }

                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<IEnumerable<MarketplaceUser>> GetAllUserAsync()
        {
            var sql = "SELECT TOP (1000) * FROM [NepalDistributers].[dbo].[users]";
            return await _db.QueryAsync<MarketplaceUser>(sql);
        }

    }
}