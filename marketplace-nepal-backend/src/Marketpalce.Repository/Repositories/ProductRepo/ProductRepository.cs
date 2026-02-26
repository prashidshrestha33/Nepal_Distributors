using Dapper;
using Marketplace.Model.Models;
using System.Data;

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
            var sql = @"SELECT
    id                  AS Id,
    sku                 AS Sku,
    name                AS Name,
    description         AS Description,
    short_description   AS ShortDescription,
    category_id         AS CategoryId,
    company_id          AS CompanyId,
    rate                AS Rate,
    brand_id            AS BrandId,
    manufacturer_id     AS ManufacturerId,
    hs_code             AS HsCode,
    status              AS Status,
    is_featured         AS IsFeatured,
    seo_title           AS SeoTitle,
    seo_description     AS SeoDescription,
    attributes          AS Attributes,
    ImageName           AS ImageName,
    created_by          AS CreatedBy,
    created_at          AS CreatedAt
FROM [NepalDistributers].[dbo].[Products]
";
            return await _db.QueryAsync<ProductModel>(sql);
        }
        public async Task<List<CategoryDto>> GetAllCategoryAsync()
        {
            const string sql = @"
        SELECT
            id AS Id,
            name AS Name,
            slug AS Slug,
            parent_id AS ParentId,
            depth AS Depth
        FROM [NepalDistributers].[dbo].[Product_Categories]
        ORDER BY depth ASC"; // make sure parents come first

            // Fetch flat list
            var flatList = (await _db.QueryAsync<CategoryDto>(sql)).ToList();

            // Build hierarchical tree
            var lookup = flatList.ToDictionary(c => c.Id);
            var rootCategories = new List<CategoryDto>();

            foreach (var category in flatList)
            {
                if (category.ParentId.HasValue)
                {
                    if (lookup.TryGetValue(category.ParentId.Value, out var parent))
                    {
                        parent.Children ??= new List<CategoryDto>();
                        parent.Children.Add(category);
                    }
                }
                else
                {
                    rootCategories.Add(category); // top-level
                }
            }

            return rootCategories;
        }

        public async Task<ProductModel> GetByIdAsync(int id)
        {
            var sql = @"SELECT
    id                  AS Id,
    sku                 AS Sku,
    name                AS Name,
    description         AS Description,
    short_description   AS ShortDescription,
    category_id         AS CategoryId,
    company_id          AS CompanyId,
    rate                AS Rate,
    brand_id            AS BrandId,
    manufacturer_id     AS ManufacturerId,
    hs_code             AS HsCode,
    status              AS Status,
    is_featured         AS IsFeatured,
    seo_title           AS SeoTitle,
    seo_description     AS SeoDescription,
    attributes          AS Attributes,
    ImageName           AS ImageName,
    created_by          AS CreatedBy,
    created_at          AS CreatedAt
FROM [NepalDistributers].[dbo].[Products]
    WHERE id = @Id";

            return await _db.QuerySingleOrDefaultAsync<ProductModel>(sql, new { Id = id });
        }

        public async Task<int> CreateAsync(ProductModel product)
        {
            // 🔹 Check for duplicate: Name + Manufacturer + Brand + Category
            var duplicate = await _db.ExecuteScalarAsync<int>(@"
        SELECT COUNT(1)
        FROM [NepalDistributers].[dbo].[products]
        WHERE Name = @Name
          AND Manufacturer_Id = @ManufacturerId
          AND Brand_Id = @BrandId
          AND Category_Id = @CategoryId
    ", product);

            if (duplicate > 0)
                throw new Exception("A product with the same name, manufacturer, brand, and category already exists.");

            // 🔹 Generate SKU and SEO
            await GenerateSkuAndSeoAsync(product);

            // 🔹 Insert product
            var sql = @"
        INSERT INTO [NepalDistributers].[dbo].[products]
        (company_id, sku, name, description, short_description, category_id, brand_id, manufacturer_id,
         rate, hs_code, status, is_featured, seo_title, seo_description, attributes, ImageName,
         created_by, created_at, updated_at)
        VALUES
        (@CompanyId, @Sku, @Name, @Description, @ShortDescription, @CategoryId, @BrandId, @ManufacturerId,
         @Rate, @HsCode, @Status, @IsFeatured, @SeoTitle, @SeoDescription, @Attributes, @ImageName,
         @CreatedBy, SYSDATETIME(), SYSDATETIME());

        SELECT CAST(SCOPE_IDENTITY() AS int);
    ";
            return await _db.ExecuteScalarAsync<int>(sql, product);
        }

        public async Task<bool> UpdateAsync(ProductModel product)
        {
            // Ensure SKU/SEO fields are generated before performing the single UPDATE on the shared connection.
            await GenerateSkuAndSeoAsync(product);

            var parameters = new DynamicParameters();
            var setClauses = new List<string>();

            if (!string.IsNullOrEmpty(product.Sku)) { setClauses.Add("sku=@Sku"); parameters.Add("@Sku", product.Sku); }
            if (!string.IsNullOrEmpty(product.Name)) { setClauses.Add("name=@Name"); parameters.Add("@Name", product.Name); }
            if (!string.IsNullOrEmpty(product.Description)) { setClauses.Add("description=@Description"); parameters.Add("@Description", product.Description); }
            if (product.CategoryId > 0) { setClauses.Add("category_id=@CategoryId"); parameters.Add("@CategoryId", product.CategoryId); }
            if (product.BrandId > 0) { setClauses.Add("brand_id=@BrandId"); parameters.Add("@BrandId", product.BrandId); }
            if (product.ManufacturerId > 0) { setClauses.Add("manufacturer_id=@ManufacturerId"); parameters.Add("@ManufacturerId", product.ManufacturerId); }
            if (product.Rate > 0) { setClauses.Add("rate=@Rate"); parameters.Add("@Rate", product.Rate); }
            if (!string.IsNullOrEmpty(product.HsCode)) { setClauses.Add("hs_code=@HsCode"); parameters.Add("@HsCode", product.HsCode); }
            if (!string.IsNullOrEmpty(product.Status)) { setClauses.Add("status=@Status"); parameters.Add("@Status", product.Status); }
            if (product.IsFeatured.HasValue) { setClauses.Add("is_featured=@IsFeatured"); parameters.Add("@IsFeatured", product.IsFeatured); }
            if (!string.IsNullOrEmpty(product.SeoTitle)) { setClauses.Add("seo_title=@SeoTitle"); parameters.Add("@SeoTitle", product.SeoTitle); }
            if (!string.IsNullOrEmpty(product.SeoDescription)) { setClauses.Add("seo_description=@SeoDescription"); parameters.Add("@SeoDescription", product.SeoDescription); }
            if (!string.IsNullOrEmpty(product.Attributes)) { setClauses.Add("attributes=@Attributes"); parameters.Add("@Attributes", product.Attributes); }
            if (!string.IsNullOrEmpty(product.ImageName)) { setClauses.Add("ImageName=@ImageName"); parameters.Add("@ImageName", product.ImageName); }

            parameters.Add("@UpdatedAt", DateTime.UtcNow);
            setClauses.Add("updated_at=@UpdatedAt");

            var sql = $@"
        UPDATE [NepalDistributers].[dbo].[products]
        SET {string.Join(", ", setClauses)}
        WHERE id=@Id";

            parameters.Add("@Id", product.Id);

            return (await _db.ExecuteAsync(sql, parameters)) > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var sql = "DELETE FROM [NepalDistributers].[dbo].[products] WHERE id=@Id";
            return (await _db.ExecuteAsync(sql, new { Id = id })) > 0;
        }
        public async Task<long> AddCatagoryAsync(CreateCategoryDto dto)
        {
            // Step 1: Check duplicate name under same parent
            var existingName = await _db.ExecuteScalarAsync<int>(
                @"SELECT COUNT(1) 
          FROM Categories 
          WHERE Name = @Name 
          AND ISNULL(Parent_Id, 0) = ISNULL(@ParentId, 0)",
                new { Name = dto.Name, ParentId = dto.ParentId });

            if (existingName > 0)
                throw new Exception("Category already exists under this parent.");

            // Step 2: Build hierarchical slug
            var slugParts = new List<string>();

            // Add current category name first
            slugParts.Add(Slugify(dto.Name));

            long? parentId = dto.ParentId;

            while (parentId != null)
            {
                var parent = await _db.QueryFirstOrDefaultAsync<CreateCategoryDto>(
                    "SELECT name FROM product_categories WHERE Id = @Id",
                    new { Id = parentId });

                if (parent == null)
                    break;

                slugParts.Add(Slugify(parent.Name));
                parentId = parent.ParentId;
            }

            // Reverse to get correct hierarchy order
            slugParts.Reverse();

            var finalSlug = string.Join("-", slugParts);

            // Step 3: Insert
            var p = new DynamicParameters();
            p.Add("@name", dto.Name);
            p.Add("@slug", finalSlug);
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

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
        public async Task<ProductModel> GetByIdAsync(int id, IDbTransaction tx)
        {
            var sql = @"SELECT *
                    FROM products
                    WHERE id = @Id";

            return await _db.QuerySingleAsync<ProductModel>(
                sql,
                new { Id = id },
                tx
            );
        }

        public async Task ApproveProductAsync(
            int id,
            string approvedByEmail,
            IDbTransaction tx)
        {
            await _db.ExecuteAsync(
                @"UPDATE dbo.products
                    SET
                        approve_ts = SYSUTCDATETIME(),
                        approve_fg = 1,
                        updated_at = SYSUTCDATETIME(),
                        status = 'Approved'
                    WHERE
                    id = @Id;",
                new { id, approvedByEmail },
                tx
            );
        }

        public async Task RejectProductAsync(
            int id,
            string rejectedByEmail,
            IDbTransaction tx)
        {
            await _db.ExecuteAsync(
                @"UPDATE dbo.products
                    SET
                        approve_ts = SYSUTCDATETIME(),
                        approve_fg = 0,
                        updated_at = SYSUTCDATETIME(),
                        status = 'Rejected'
                    WHERE
                    id = @Id;",
                new { id, rejectedByEmail },
                tx
            );
        }
        public async Task AddProductCreditAsync(
            int companyId,
            int productId,
            string remarks,
            IDbTransaction tx)
        {
            await _db.ExecuteAsync(
                "sp_AddProductAndUpdateCredit",
                new
                {
                    company_id = companyId,
                    product_id = productId,
                    remarks
                },
                tx,
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task InsertRejectNoteAsync(
            int companyId,
            int productId,
            string email,
            string remarks,
            IDbTransaction tx)
        {
            await _db.ExecuteAsync(
                @"INSERT INTO Notes (companyId, source, email, Remarks)
              VALUES (@companyId, @source, @email, @remarks)",
                new
                {
                    companyId,
                    source = productId.ToString(),
                    email,
                    remarks
                },
                tx
            );
        }

        // Add this private helper method to the ProductRepository class to resolve CS0103
        private static Task GenerateSkuAndSeoAsync(ProductModel product)
        {
            // Example implementation: generate SKU and SEO fields if missing
            if (string.IsNullOrWhiteSpace(product.Sku))
            {
                product.Sku = $"SKU-{product.Name?.Replace(" ", "-").ToUpperInvariant()}";
            }
            if (string.IsNullOrWhiteSpace(product.SeoTitle))
            {
                product.SeoTitle = product.Name;
            }
            if (string.IsNullOrWhiteSpace(product.SeoDescription))
            {
                product.SeoDescription = product.Description?.Length > 150
                    ? product.Description.Substring(0, 150)
                    : product.Description;
            }
            return Task.CompletedTask;
        }
        public async Task<IEnumerable<ProductModel>> SearchProductsAsync(
    string? categoryIds,
    string? keyword,
    long? companyId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@CategoryIds", categoryIds, DbType.String);
            parameters.Add("@Keyword", keyword, DbType.String);
            parameters.Add("@CompanyId", companyId, DbType.Int64);

            var result = await _db.QueryAsync<ProductModel>(
                "dbo.sp_GetProductsByCategoryAndKeyword",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result;
        }
    }
}