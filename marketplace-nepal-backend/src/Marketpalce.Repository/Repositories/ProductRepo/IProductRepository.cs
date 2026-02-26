using Marketplace.Model.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketpalce.Repository.Repositories.ProductRepo
{
    public interface IProductRepository
    {
        Task<IEnumerable<ProductModel>> GetAllAsync();
        Task<List<CategoryDto>> GetAllCategoryAsync();
        Task<ProductModel> GetByIdAsync(int id);
        Task<int> CreateAsync(ProductModel product);
        Task<bool> UpdateAsync(ProductModel product);
        Task<bool> DeleteAsync(int id);
        Task<long> AddCatagoryAsync(CreateCategoryDto dto);
        Task MoveCatagoryAsync(MoveCategoryDto dto);
        Task<string> GetCatagoryTreeJsonAsync();
        Task<IEnumerable<CategoryDto>> GetCatagoryChildrenAsync(long? parentId);
        Task<CategoryDto?> GetCatagoryByIdAsync(long id);
        Task<ProductModel> GetByIdAsync(int id, IDbTransaction tx);

        Task ApproveProductAsync(
            int id,
            string approvedByEmail,
            IDbTransaction tx);

        Task RejectProductAsync(
            int id,
            string rejectedByEmail,
            IDbTransaction tx);

        Task AddProductCreditAsync(
            int companyId,
            int productId,
            string remarks,
            IDbTransaction tx);

        Task InsertRejectNoteAsync(
            int companyId,
            int productId,
            string email,
            string remarks,
            IDbTransaction tx);

        Task<bool> ApproveProductAsync(long Productid, string approvedBy, string details, IDbTransaction? transaction = null);
        Task<IEnumerable<ProductModel>> SearchProductsAsync(string? categoryIds, string? keyword, long? companyId);

    }
}
