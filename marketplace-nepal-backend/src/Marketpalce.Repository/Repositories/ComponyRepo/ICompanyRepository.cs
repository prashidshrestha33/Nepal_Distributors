using Marketplace.Model.Models;
using Marketplace.Models;
using System.Collections.Generic;
using System.Data;

namespace Marketpalce.Repository.Repositories.ComponyRepo
{
    public interface ICompanyRepository
    {
        Task<CompanyNotificationSettingsDto?> GetNotificationSettingsAsync(long companyId);
        Task<bool> UpdateNotificationSettingsAsync(UpdateNotificationSettingsRequest req);
        Task<long> CreateAsync(Company company, IDbTransaction? transaction = null);
        Task<Company?> GetByIdAsync(long id);
        Task<IEnumerable<Company>> ListAsync(int page = 1, int pageSize = 50);
        Task<long> AssignCategoryAsync(long CategoryId, long companyId);
        Task<(int totalRows, List<string> emails)> ApproveCompanyAsync(
     long companyId,
     string approveFg,
     string rejectComment);

        Task<CompanyDetailDto?> GetCompanyDetailAsync(long companyId);
        Task<bool> UpdateCompanyFieldAsync(UpdateCompanyFieldRequest request);
        Task<bool> UpdateAsync(UpdateCompanyFieldRequest request);

        Task<long> UpdateCompanyAsync(Company company);
    }
}