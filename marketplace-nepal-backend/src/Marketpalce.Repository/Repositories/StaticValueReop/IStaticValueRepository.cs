using Marketplace.Model.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories.StaticValueReop
{
    public interface IStaticValueRepository
    {
        Task<bool> CreateAsync(StaticValue model);
        Task<StaticValue?> GetAsync(StaticValueFilter model);
        Task<bool> UpdateAsync(StaticValue model);
        Task<bool> DeleteAsync(string key);
        Task<IEnumerable<StaticValue>> ListAllAsync(string cid);
        Task<long> CreateCatalogAsync(StaticValueCatalog model);
        Task<StaticValueCatalog?> GetCatalogAsync(long id);
        Task<bool> UpdateCatalogAsync(StaticValueCatalog model);
        Task<bool> DeleteCatalogAsync(long id);
        Task<IEnumerable<StaticValueCatalog>> ListAllCatalogAsync();

    }
}
