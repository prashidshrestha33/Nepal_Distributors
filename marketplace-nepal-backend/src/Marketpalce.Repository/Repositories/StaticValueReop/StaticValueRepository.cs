using Dapper;
using Marketplace.Model.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories.StaticValueReop
{
  
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
        // Create
        public async Task<long> CreateCatalogAsync(StaticValueCatalog model)
        {
            const string sql = @"INSERT INTO dbo.static_value_cataglog
            (Catalog_Name, Catalog_Type,Catalog_Description)
            OUTPUT INSERTED.Catalog_id
            VALUES (@CatalogName, @CatalogType,@CatalogDescription);";
            var rows = await _db.ExecuteAsync(sql, model);
            return rows;
        }

        // Read single
        public async Task<StaticValueCatalog?> GetCatalogAsync(long id)
        {
            const string sql = "SELECT Catalog_id as CatalogId, Catalog_Name as CatalogName,Catalog_Type as CatalogType,Catalog_Description as CatalogDescription FROM dbo.static_value_cataglog WHERE Catalog_id = @Catalog_id";
            return await _db.QuerySingleOrDefaultAsync<StaticValueCatalog>(sql, new { Catalog_id = id });
        }

        // Update
        public async Task<bool> UpdateCatalogAsync(StaticValueCatalog model)
        {
            const string sql = @"
            UPDATE dbo.static_value_cataglog
            SET 
            Catalog_Name = @CatalogName,
            Catalog_Type = @CatalogType,
            Catalog_Description = @CatalogDescription,
            WHERE Catalog_id = @CatalogId;";
            var rows = await _db.ExecuteAsync(sql, model);
            return rows > 0;
        }

        // Delete
        public async Task<bool> DeleteCatalogAsync(long id)
        {
            const string sql = "DELETE FROM dbo.static_value_cataglog WHERE Catalog_id = @CatalogId;";
            var rows = await _db.ExecuteAsync(sql, new { Catalog_id = id });
            return rows > 0;
        }

        // List all
        public async Task<IEnumerable<StaticValueCatalog>> ListAllCatalogAsync()
        {
            const string sql = "SELECT  Catalog_id as CatalogId, Catalog_Name as CatalogName,Catalog_Type as CatalogType,Catalog_Description as CatalogDescription FROM dbo.static_value_cataglog";
            return await _db.QueryAsync<StaticValueCatalog>(sql);
        }

    }
}
