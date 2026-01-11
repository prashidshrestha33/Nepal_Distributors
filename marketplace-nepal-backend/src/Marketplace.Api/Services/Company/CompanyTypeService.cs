using Marketpalce.Repository.Repositories.ComponyRepo;
using Marketpalce.Repository.Repositories.StaticValueReop;
using Marketplace.Model.Models;

namespace Marketplace.Api.Services.Company
{
    public class CompanyTypeService : ICompanyTypeService
    {
        private readonly ICompanyTypeRepository _companyTypeRepository;
        public CompanyTypeService(ICompanyTypeRepository  companyTypeRepository)
        {
            _companyTypeRepository = companyTypeRepository;
        }

        public Task<List<StaticValue>> GetCompanyTypesAsync()
        {
            return _companyTypeRepository.GetCompanyTypesAsync();
        }

    }
}
