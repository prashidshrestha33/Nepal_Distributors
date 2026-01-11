using Marketplace.Model.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories.StaticValueReop
{
    public interface ICompanyTypeRepository
    {
        Task<List<StaticValue>> GetCompanyTypesAsync();
    }
}
