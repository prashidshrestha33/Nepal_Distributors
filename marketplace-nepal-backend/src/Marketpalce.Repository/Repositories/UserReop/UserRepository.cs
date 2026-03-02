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
    users.id AS Id,
    users.company_id AS CompanyId,
    users.email AS Email,
    users.password_hash AS PasswordHash,
    users.full_name AS FullName,
    users.phone AS Phone,
    users.role AS Role,
    users.status AS Status,
    users.credits AS Credits,
    users.tier AS Tier,
    users.google_id AS GoogleId,
    users.facebook_id AS FacebookId,
    users.created_at AS CreatedAt,
    users.updated_at AS UpdatedAt,
    users.last_login_at AS LastLoginAt,
    case when isnull(companie.approve_fg,'n')='y' then 'y' else 'n'
    end AS ApproveFG,
    companie.name as CompanyName
    FROM dbo.users as users join 
[dbo].[companies] as companie on users.company_id=companie.id WHERE 1=1";
            if (email != null)
                sql += "AND LOWER(email) = LOWER(@Email);  ";
            //else if (googleId != null)
            //    sql += "AND google_id = @GoogleId; ";
            //else if (facebookId != null)
            //    sql += "AND facebook_id = @FacebookId;";
            MarketplaceUser test = await _db.QueryFirstOrDefaultAsync<MarketplaceUser>(sql, new { Email = email, GoogleId = googleId, FacebookId = facebookId });
            return await _db.QueryFirstOrDefaultAsync<MarketplaceUser>(sql, new { Email = email, GoogleId = googleId, FacebookId = facebookId });
        }

        public void UpdateToken(string email, string googleId = null, string facebookId = null)
        {
            try
            {
                string sql = null;
                object parameters = null;

                if (googleId != null)
                {
                    sql = "UPDATE users SET google_id = @googleId WHERE email = @email";
                    parameters = new { email, googleId };
                }
                else if (facebookId != null)
                {
                    sql = "UPDATE users SET facebook_id = @facebookId WHERE email = @email";
                    parameters = new { email, facebookId };
                }
                else
                {
                    // Nothing to update
                    return;
                }

                _db.ExecuteAsync(sql, parameters);                
            }
            catch (Exception ex)
            {
                // Optional: log exception
                throw;
            }
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
        public async Task<List<MarketplaceUser>> GetAllid(long companyid)
        {
            string sql = @"
        SELECT
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
            created_at AS CreatedAt,
            updated_at AS UpdatedAt,
            approve_dt AS ApproveDt,
            approve_fg AS ApproveFG,
            last_login_at AS LastLoginAt,
            google_id AS GoogleId,
            facebook_id AS FacebookId,
            fmc_token AS FmcToken
        FROM dbo.users
        WHERE company_id = @companyid;
    ";

            return (await _db.QueryAsync<MarketplaceUser>(sql, new { companyid })).ToList();
        }

        public async Task<MarketplaceUser?> GetByIdAsync(long id)
        {
            const string sql = "SELECT" +
                " id AS Id," +
                " company_id AS CompanyId," +
                " email AS Email," +
                " password_hash AS PasswordHash," +
                " full_name AS FullName," +
                " phone AS Phone, " +
                " role AS Role," +
                " status AS Status," +
                " credits AS Credits," +
                " tier AS Tier," +
                " created_at AS CreatedAt," +
                " updated_at AS UpdatedAt," +
                " approve_dt AS ApproveDt," +
                " approve_fg AS ApproveFG," +
                " last_login_at AS LastLoginAt," +
                " google_id AS GoogleId," +
                " facebook_id AS FacebookId," +
                " fmc_token AS FmcToken" +
                " FROM [dbo].[users] WHERE id = @Id";
            return await _db.QuerySingleOrDefaultAsync<MarketplaceUser>(sql, new { Id = id });
        }
        public async Task<bool> UpdateUserAsync(MarketplaceUser user, IDbTransaction? transaction = null)
        {
            try
            {
                const string sql = @"
                UPDATE dbo.users
                SET
                    email         = @Email,
                    full_name     = @FullName,
                    phone         = @Phone,
                    role          = @Role,
                    updated_at    = SYSUTCDATETIME()
                WHERE
                    id = @Id;
                ";

                var rowsAffected = await _db.ExecuteAsync(sql, new
                {
                    user.Email,
                    user.FullName,
                    user.Phone,
                    user.Role,
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
        public async Task<bool> CheckAuthTokenAsync(long userId, string otp)
        {
            const string sql = @"
        SELECT COUNT(1)
        FROM [notifications]
        WHERE type = 'auth'
          AND ISNULL(is_read, 'n') = 'n'
          AND created_at >= DATEADD(MINUTE, -10, SYSUTCDATETIME())
          AND otp_token = @Otp
          AND user_id = @UserId
    ";

            var count = await _db.ExecuteScalarAsync<int>(sql, new { UserId = userId, Otp = otp });

            if (count > 0)
            {
                const string updateSql = @"
            UPDATE notifications
            SET is_read = 'y'
            WHERE user_id = @UserId
            AND  otp_token = @Otp;";

                await _db.ExecuteAsync(updateSql, new { UserId = userId, Otp = otp });
            }
            return count > 0; // true if a matching unread notification exists
        }
        public async Task<bool> CheckOtpAUth(string email, string otp)
        {
            const string sql = @"
          SELECT COUNT(1)
        FROM [notifications]
        WHERE type = 'auth'
          AND ISNULL(is_read, 'n') = 'n'
          AND created_at >= DATEADD(MINUTE, -20, SYSUTCDATETIME())
          AND otp_token = @Otp
          AND payload = @email
    ";

            var count = await _db.ExecuteScalarAsync<int>(sql, new { email = email, Otp = otp });

            if (count > 0)
            {
                const string updateSql = @"
            UPDATE notifications
            SET is_read = 'y'
            WHERE  payload = @email
            AND  otp_token = @Otp;";

                await _db.ExecuteAsync(updateSql, new { email = email, Otp = otp });
            }
            return count > 0; // true if a matching unread notification exists
        }
        
        public async Task UpdateAuthTokenAsync(long userid, string ranno, string email)
        {
            const string updateSql = @"
            UPDATE notifications
            SET is_read = 'e'
            WHERE user_id = @userid;
        ";

            await _db.ExecuteAsync(updateSql, new { userid });
            const string sql = "insert into notifications(user_id,type,created_at,otp_token,payload,is_read) " +
                "values (@userid,'auth',SYSUTCDATETIME(),@ranno,@email,'n')";
            await _db.ExecuteAsync(sql, new { @userid = userid, @ranno = ranno, @email = email });
        }
        public async Task UpdateOtpTokem(string ranno, string email)
        {
            const string updateSql = @"
            UPDATE notifications
            SET is_read = 'e'
            WHERE payload = @email ;
        ";

            await _db.ExecuteAsync(updateSql, new { email });
            const string sql = "insert into notifications(type,created_at,otp_token,payload,is_read) " +
                "values ('auth',SYSUTCDATETIME(),@ranno,@email,'n')";
            await _db.ExecuteAsync(sql, new { @ranno = ranno, @email = email });
        }
        public async Task UpdatePasswordAsync(long userid,string Passwordhass)
        {
            const string sql = "update users set password_hash = @Passwordhass where id = @userid";
            await _db.ExecuteAsync(sql, new { @userid = userid, @Passwordhass = Passwordhass });
        }
        public async Task<(string? payload, int? isRead, long? userId)> AuthTokenValidation(string token)
        {
            // Step 1: Select the notification within the last 5 minutes
            const string selectSql = @"
        SELECT TOP 1 payload, is_read, user_id
        FROM notifications
        WHERE created_at >= DATEADD(MINUTE, -50, SYSUTCDATETIME())
          AND otp_token = @token;
    ";

            var result = await _db.QueryFirstOrDefaultAsync<(string payload, int is_read, long user_id)>(
                selectSql,
                new { token }
            );

            if (result == default)
            {
                return (null, null, null);
            }

            // Step 2: If unread, mark as read
            if (result.is_read == 0)
            {
                const string updateSql = @"
            UPDATE notifications
            SET is_read = 'y'
            WHERE otp_token = @token;
        ";

                await _db.ExecuteAsync(updateSql, new { token });
                result.is_read = 0;
            }

            return (result.payload, result.is_read, result.user_id);
        }

        public Task<int> SetFcmId(string FcmId, string userid)
        {
            string updateSql = @"update [dbo].[users] 
            set fmc_token=@FcmId
            where 
            id=@userid;";

            return _db.ExecuteAsync(updateSql, new { @FcmId=FcmId, userid=userid });
        }
        public Task<string?> GetTokenByUserIdAsync(int userId)
        {
            // TODO: fetch from DB
            return Task.FromResult<string?>("f56dblt_MfquiMe6dkAzv4:APA91bE5_8eCtnsxaouGr_yJ4l2mKYcmQYGi5KfkDie7o20kOqxsh_PKu3MJhi9wGZhcbr6jmh7WhXdCstdMDRvgmPLsxcmokMa9ojrTYqQwZs2Lp3YwIzo");
        }

    }
}
