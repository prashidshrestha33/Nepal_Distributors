using Marketplace.Api.Models;
using Marketplace.Model.Models;
using Marketplace.Models;

namespace Marketplace.Api.Services.Company
{
    public interface ICompanyTypeService
    {
        Task<List<StaticValue>> GetCompanyTypesAsync();
        Task SendRegistrationEmailAsync(string email, string componeyid, string componeyName, string role);
    }
}   
