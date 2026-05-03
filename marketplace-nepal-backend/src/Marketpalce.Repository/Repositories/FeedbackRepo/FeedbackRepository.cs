using Dapper;
using Marketplace.Model.Models;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories.FeedbackRepo
{
    public class FeedbackRepository : IFeedbackRepository
    {
        private readonly IDbConnection _db;

        public FeedbackRepository(IDbConnection db)
        {
            _db = db;
        }

        public async Task<long> CreateAsync(Feedback feedback)
        {
            string sql = @"
                INSERT INTO dbo.feedbacks (user_id, company_id, subject, message, File_name, created_at)
                OUTPUT INSERTED.id
                VALUES (@UserId, @CompanyId, @Subject, @Message, @FileName, SYSUTCDATETIME());";

            return await _db.QuerySingleAsync<long>(sql, feedback);
        }

        public async Task<IEnumerable<Feedback>> GetAllAsync()
        {
            string sql = @"
                SELECT 
                    f.id AS Id, 
                    f.user_id AS UserId, 
                    f.company_id AS CompanyId, 
                    f.subject AS Subject, 
                    f.message AS Message, 
                    f.File_name AS FileName, 
                    f.created_at AS CreatedAt,
                    u.full_name AS FullName,
                    u.email AS Email
                FROM dbo.feedbacks f
                LEFT JOIN dbo.users u ON f.user_id = u.id
                ORDER BY f.created_at DESC;";

            return await _db.QueryAsync<Feedback>(sql);
        }

        public async Task<Feedback> GetByIdAsync(long id)
        {
            string sql = @"
                SELECT 
                    f.id AS Id, 
                    f.user_id AS UserId, 
                    f.company_id AS CompanyId, 
                    f.subject AS Subject, 
                    f.message AS Message, 
                    f.File_name AS FileName, 
                    f.created_at AS CreatedAt,
                    u.full_name AS FullName,
                    u.email AS Email
                FROM dbo.feedbacks f
                LEFT JOIN dbo.users u ON f.user_id = u.id
                WHERE f.id = @Id;";

            return await _db.QuerySingleOrDefaultAsync<Feedback>(sql, new { Id = id });
        }

        public async Task<IEnumerable<StaticValue>> GetCategoriesAsync()
        {
            string sql = @"
                SELECT 
                    static_value AS StaticValueKey, 
                    static_data AS StaticData,
display_order DisplayOrder
                FROM static_value 
                WHERE Catalog_id = (SELECT Catalog_id FROM static_value_cataglog WHERE Catalog_Name='FeedbackCatagory');";

            return await _db.QueryAsync<StaticValue>(sql);
        }
    }
}
