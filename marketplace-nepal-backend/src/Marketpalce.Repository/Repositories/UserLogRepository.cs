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
        public static async Task LogUserActionAsync(IDbConnection db, long? productId, long? companyId, string action, string details, string performedBy, IDbTransaction? transaction = null)
        {
            try
            {
                const string logSql = @"
                INSERT INTO user_logs (product_id, company_id, action, logged_dt, details, performed_by)
                VALUES (@ProductId, @CompanyId, @Action, SYSUTCDATETIME(), @Details, @PerformedBy);
                ";
                
                await db.ExecuteAsync(logSql, new
                {
                    ProductId = productId,
                    CompanyId = companyId,
                    Action = action,
                    Details = details,
                    PerformedBy = performedBy
                }, transaction: transaction);
            }
            catch (Exception ex)
            {
                // Safety: Log the error but don't crash the main transaction
                // In production, you would typically use a logging library like Serilog here.
                Console.WriteLine($"Audit log failed: {ex.Message}");
            }
        }
    }
}
