using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using System;
using Marketplace.Model.Models;


namespace Marketpalce.Repository.Repositories.ProductRepo
{
    public class ProductRepository : IProductRepository

    {
        private readonly IDbConnection _db;
        public ProductRepository(IDbConnection db)
        {
            _db = db;
        }

        public async Task<IEnumerable<ProductModel>> GetAllAsync()
        {
            var sql = "SELECT TOP (1000) * FROM [NepalDistributers].[dbo].[products]";
            return await _db.QueryAsync<ProductModel>(sql);
        }

        public async Task<IEnumerable<CategoryDto>> GetAllCategoryAsync()
        {
            var sql = "SELECT TOP (1000) * FROM [NepalDistributers].[dbo].[Product_Categories]";
            return await _db.QueryAsync<CategoryDto>(sql);
        }

        public async Task<ProductModel> GetByIdAsync(int id)
        {
            var sql = "SELECT * FROM [NepalDistributers].[dbo].[products] WHERE id = @Id";
            return await _db.QuerySingleOrDefaultAsync<ProductModel>(sql, new { Id = id });
        }

        public async Task<int> CreateAsync(ProductModel product)
        {
            var sql = @"
            INSERT INTO [NepalDistributers].[dbo].[products]
            (sku, name, description, short_description, category_id, brand_id, manufacturer_id, rate, hs_code, status, is_featured, seo_title, seo_description, attributes,ImageName, created_by, created_at,updated_at)
            VALUES (@Sku, @Name, @Description, @ShortDescription, @CategoryId, @BrandId, @ManufacturerId, @Rate, @HsCode, @Status, @IsFeatured, @SeoTitle, @SeoDescription, @Attributes,@ImageName, @CreatedBy, SYSDATETIME(), SYSDATETIME());
            SELECT CAST(SCOPE_IDENTITY() as int);
            ";
            return await _db.ExecuteScalarAsync<int>(sql, product);
        }

        public async Task<bool> UpdateAsync(ProductModel product)
        {
            var sql = @"
            UPDATE [NepalDistributers].[dbo].[products]
            SET sku=@Sku, name=@Name, description=@Description, short_description=@ShortDescription, category_id=@CategoryId, subcategory_id=@SubCategoryId, subsubcategory_id=@SubSubCategoryId, brand_id=@BrandId, manufacturer_id=@ManufacturerId, rate=@Rate, hs_code=@HsCode, status=@Status, is_featured=@IsFeatured, seo_title=@SeoTitle, seo_description=@SeoDescription, attributes=@Attributes, Image_name=@ImageName, updated_at=@UpdatedAt
            WHERE id=@Id";
            return (await _db.ExecuteAsync(sql, product)) > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var sql = "DELETE FROM [NepalDistributers].[dbo].[products] WHERE id=@Id";
            return (await _db.ExecuteAsync(sql, new { Id = id })) > 0;
        }
        public async Task<long> AddCatagoryAsync(CreateCategoryDto dto)
        {
            var p = new DynamicParameters();
            var slug = string.IsNullOrWhiteSpace(dto.Slug) ? Slugify(dto.Name) : Slugify(dto.Slug);
            p.Add("@name", dto.Name);
            p.Add("@slug", slug);
            p.Add("@parent_id", dto.ParentId);
            p.Add("@new_id", dbType: DbType.Int64, direction: ParameterDirection.Output);

            await _db.ExecuteAsync("dbo.sp_AddCategory", p, commandType: CommandType.StoredProcedure);
            return p.Get<long>("@new_id");
        }

        // Move (re-parent) a category via sp_MoveCategory
        public async Task MoveCatagoryAsync(MoveCategoryDto dto)
        {
            var p = new DynamicParameters();
            p.Add("@category_id", dto.CategoryId);
            p.Add("@new_parent_id", dto.NewParentId);
            await _db.ExecuteAsync("dbo.sp_MoveCategory", p, commandType: CommandType.StoredProcedure);
        }

        // Return nested JSON tree (string) from stored proc
        public async Task<string> GetCatagoryTreeJsonAsync()
        {
            // sp_GetCategoriesTreeJson returns JSON text
            var json = await _db.QueryFirstOrDefaultAsync<string>("dbo.sp_GetCategoriesTreeJson", commandType: CommandType.StoredProcedure);
            return json ?? "[]";
        }

        // Get direct children
        public async Task<IEnumerable<CategoryDto>> GetCatagoryChildrenAsync(long? parentId)
        {
            var sql = @"SELECT id AS Id, name AS Name, slug AS Slug, parent_id AS ParentId, depth AS Depth
                        FROM dbo.Product_Categories
                        WHERE parent_id = @pid
                        ORDER BY name";
            return await _db.QueryAsync<CategoryDto>(sql, new { pid = parentId });
        }

        // Get single category by id
        public async Task<CategoryDto?> GetCatagoryByIdAsync(long id)
        {
            var sql = @"SELECT id AS Id, name AS Name, slug AS Slug, parent_id AS ParentId, depth AS Depth
                        FROM dbo.Product_Categories WHERE id = @id";
            return await _db.QueryFirstOrDefaultAsync<CategoryDto>(sql, new { id });
        }

        private static string Slugify(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return "";
            var s = text.ToLowerInvariant().Trim();
            s = System.Text.RegularExpressions.Regex.Replace(s, @"\s+", "-");
            s = System.Text.RegularExpressions.Regex.Replace(s, @"[^a-z0-9\-]", "");
            return s;
        }
        public async Task<bool> ApproveProductAsync(long Productid, string approvedBy, string details, IDbTransaction? transaction = null)
        {
            try
            {
                const string approveSql = @"
                UPDATE dbo.products
                    SET
                        approve_ts = SYSUTCDATETIME(),
                        approve_fg = 1,
                        updated_at = SYSUTCDATETIME()
                    WHERE
                    id = @Id;
                ";

                var approveRows = await _db.ExecuteAsync(approveSql, new { Id = Productid }, transaction);

                if (approveRows > 0)
                {
                    await UserLogRepository.LogUserActionAsync(_db, Productid, "approveUser", details, approvedBy, transaction);
                    return true;
                }

                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}