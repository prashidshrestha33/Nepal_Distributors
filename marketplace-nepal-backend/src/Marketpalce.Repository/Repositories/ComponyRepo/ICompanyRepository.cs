using Marketplace.Models;
using System.Data;
using System.Collections.Generic;

namespace Marketpalce.Repository.Repositories.ComponyRepo
{
    public interface ICompanyRepository
    {
        // Accept optional transaction so callers can create both company+user in same transaction
        Task<long> CreateAsync(Company company, IDbTransaction? transaction = null);
        Task<Company?> GetByIdAsync(long id);
        Task<IEnumerable<Company>> ListAsync(int page = 1, int pageSize = 50);
        Task<long> AssignCategoryAsync(long CategoryId, long companyId);
        Task<(int totalRows, List<string> emails)> ApproveCompanyAsync(
     long companyId,
     string approveFg,
     string rejectComment);
    }
}