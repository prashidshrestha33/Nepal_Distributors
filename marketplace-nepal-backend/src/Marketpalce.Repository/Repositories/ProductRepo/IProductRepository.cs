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
        Task<bool> ApproveProductAsync(long Productid, string approvedBy, string details, IDbTransaction? transaction = null);


    }
}
