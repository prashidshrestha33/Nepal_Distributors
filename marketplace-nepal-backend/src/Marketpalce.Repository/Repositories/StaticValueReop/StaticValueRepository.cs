using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories.StaticValueReop
{
    public class StaticValue
    {
        public string StaticValueKey { get; set; }    // Maps to static_value
        public string StaticData { get; set; }        // Maps to static_data
    }

    public class StaticValueRepository : IStaticValueRepository
    {
        private readonly IDbConnection _db;

        public StaticValueRepository(IDbConnection db)
        {
            _db = db;
        }

        // Create
        public async Task<bool> CreateAsync(string key, string data)
        {
            const string sql = @"
INSERT INTO dbo.static_value (static_value, static_data)
VALUES (@StaticValue, @StaticData);";
            var rows = await _db.ExecuteAsync(sql, new { StaticValue = key, StaticData = data });
            return rows > 0;
        }

        // Read single
        public async Task<StaticValue?> GetAsync(string key)
        {
            const string sql = "SELECT static_value AS StaticValueKey, static_data AS StaticData FROM dbo.static_value WHERE static_value = @StaticValue";
            return await _db.QuerySingleOrDefaultAsync<StaticValue>(sql, new { StaticValue = key });
        }

        // Update
        public async Task<bool> UpdateAsync(string key, string data)
        {
            const string sql = @"
UPDATE dbo.static_value
SET static_data = @StaticData
WHERE static_value = @StaticValue;";
            var rows = await _db.ExecuteAsync(sql, new { StaticValue = key, StaticData = data });
            return rows > 0;
        }

        // Delete
        public async Task<bool> DeleteAsync(string key)
        {
            const string sql = "DELETE FROM dbo.static_value WHERE static_value = @StaticValue";
            var rows = await _db.ExecuteAsync(sql, new { StaticValue = key });
            return rows > 0;
        }

        // List all
        public async Task<IEnumerable<StaticValue>> ListAllAsync()
        {
            const string sql = "SELECT static_value AS StaticValueKey, static_data AS StaticData FROM dbo.static_value";
            return await _db.QueryAsync<StaticValue>(sql);
        }
      
    }
}
