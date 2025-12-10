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
        Task<bool> CreateAsync(string key, string data);
        Task<StaticValue?> GetAsync(string key);
        Task<bool> UpdateAsync(string key, string data);
        Task<bool> DeleteAsync(string key);
        Task<IEnumerable<StaticValue>> ListAllAsync();
        Task<long> CreateCatalogAsync(StaticValueCatalog model);
        Task<StaticValueCatalog?> GetCatalogAsync(long id);
        Task<bool> UpdateCatalogAsync(StaticValueCatalog model);
        Task<bool> DeleteCatalogAsync(long id);
        Task<IEnumerable<StaticValueCatalog>> ListAllCatalogAsync();

    }
}
