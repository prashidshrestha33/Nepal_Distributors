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
        public async Task<List<StaticValue>> GetCompanyTypesAsync()
        {
            string sql = @"
               SELECT 
                    static_value as StaticValueKey ,
                    static_data as StaticData,
                    COALESCE(display_order, 0) AS DisplayOrder
                FROM static_value s join [static_value_cataglog] sc on s.[Catalog_id] = sc.[Catalog_id] where sc.Catalog_id=1 and  
                sc.catalog_name='CompanyType'
                ORDER BY display_order ASC;
            ";

            var result = await _db.QueryAsync<StaticValue>(sql);
            return result.ToList();
        }
    }
}
