using Dapper;
using Marketplace.Model.Models;
using System.Data;

namespace Marketpalce.Repository.Repositories.StaticValueReop
{
    public class CompanyTypeRepository : ICompanyTypeRepository
    {
        private readonly IDbConnection _db;
        public CompanyTypeRepository(IDbConnection db)
        {
            _db = db;
        }
        public async Task<List<CatalogTypeDto>> GetCompanyTypesAsync()
        {
            string sql = @"
                SELECT DISTINCT
                    catalog_type      AS CatalogType,
                    COALESCE(display_order, 0) AS DisplayOrder
                FROM static_value_cataglog
                ORDER BY catalog_type ASC;
            ";

            var result = await _db.QueryAsync<CatalogTypeDto>(sql);
            return result.ToList();
        }
    }
}
