using Marketplace.Model.Models;

namespace Marketplace.Api.Services.Company
{
    public interface ICompanyTypeService
    {
        Task<List<StaticValue>> GetCompanyTypesAsync();
    }
}
