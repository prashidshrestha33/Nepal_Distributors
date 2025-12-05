using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories
{
    public static class UserLogRepository
    {
        public static async Task LogUserActionAsync(IDbConnection db, long userId, string action, string details, string performedBy, IDbTransaction? transaction = null)
        {
            const string logSql = @"
            INSERT INTO dbo.user_logs (user_id, action, logged_dt, details, performed_by)
            VALUES (@UserId, @Action, SYSUTCDATETIME(), @Details, @PerformedBy);
            ";
            await db.ExecuteAsync(logSql, new
            {
                UserId = userId,
                Action = action,
                Details = details,
                PerformedBy = performedBy
            }, transaction: transaction);
        }
    }
}
