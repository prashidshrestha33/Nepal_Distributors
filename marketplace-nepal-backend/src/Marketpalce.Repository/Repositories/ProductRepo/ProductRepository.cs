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
            var sql = @"
    SELECT 
        p.Id,
        p.Sku,
        p.Name,
        p.Description,
        p.Short_Description AS ShortDescription,
        p.Category_Id AS CategoryId,
        p.Company_Id AS CompanyId,
        p.Rate,
        p.Brand_Id AS BrandId,
        p.Manufacturer_Id AS ManufacturerId,
        p.Hs_Code AS HsCode,
        p.Status,
        p.Is_Featured AS IsFeatured,
        p.Seo_Title AS SeoTitle,
        p.Seo_Description AS SeoDescription,
        p.Attributes,
        p.Created_By AS CreatedBy,
        p.Created_At AS CreatedAt,

        pi.Id,
        pi.ProductId,
        pi.ImageName,
        pi.IsDefault,
        pi.CreatedAt

    FROM Products p
    LEFT JOIN ProductImages pi ON p.Id = pi.ProductId
    ";

            var productDictionary = new Dictionary<int, ProductModel>();

            var products = await _db.QueryAsync<ProductModel, ProductImageModel, ProductModel>(
                sql,
                (product, image) =>
                {
                    if (!productDictionary.TryGetValue(product.Id, out var currentProduct))
                    {
                        currentProduct = product;
                        currentProduct.Images = new List<ProductImageModel>();
                        productDictionary.Add(currentProduct.Id, currentProduct);
                    }

                    if (image != null)
                    {
                        currentProduct.Images.Add(image);
                    }

                    return currentProduct;
                },
                splitOn: "Id"
            );

            return productDictionary.Values;
        }
        public async Task<List<CategoryDto>> GetAllCategoryAsync()
        {
            try
            {
                const string sql = @"
    SELECT id AS Id, name AS Name, slug AS Slug, parent_id AS ParentId, depth AS Depth, imageUrl as Image
    FROM dbo.Product_Categories
    ORDER BY depth ASC";

                var flatList = (await _db.QueryAsync<CategoryDto>(sql)).ToList();

                var lookup = flatList.ToDictionary(c => c.Id);

                foreach (var cat in flatList)
                    cat.Children = new List<CategoryDto>();

                var roots = new List<CategoryDto>();

                foreach (var cat in flatList)
                {
                    if (cat.ParentId.HasValue && cat.ParentId.Value != 0 && lookup.ContainsKey(cat.ParentId.Value))
                    {
                        lookup[cat.ParentId.Value].Children.Add(cat); // <--- NullReferenceException can happen here
                    }
                    else
                    {
                        roots.Add(cat);
                    }
                }

                return roots;
            }
            catch (Exception ex)
            {
                throw new Exception("Failed to load categories from database.", ex);
            }
        }
        public async Task<int> AddReviewAsync(ProductReview review)
        {
            string sql = @"
        INSERT INTO ProductReviews
        (
            ProductId,
            Rating,
            Comment
        )
        VALUES
        (
            @ProductId,
            @Rating,
            @Comment
        )";

            var result = await _db.ExecuteAsync(sql, review);

            return result;
        }
        public async Task<List<CategoryDto>> GetparentChild(int parentid = 0)
        {
            string sql = @"
        SELECT
            id AS Id,
            name AS Name,
            slug AS Slug,
            parent_id AS ParentId,
            depth AS Depth
        FROM [NepalDistributers].[dbo].[Product_Categories] where 1=1";


            if (parentid == 0)
            {
                sql += " AND depth = 0";
            }
            else
            {
                sql += " AND parent_id = @ParentId";
            }

            sql += " ORDER BY depth ASC"; // make sure parents come first

            // Fetch flat list
            var rootCategories = new List<CategoryDto>();
            rootCategories = (await _db.QueryAsync<CategoryDto>(sql, new { ParentId = parentid })).ToList();

            return rootCategories;
        }

        public async Task<ProductModel> GetByIdAsync(int id)
        {
            var sql = @"
    SELECT 
        p.id AS Id,
        p.sku AS Sku,
        p.name AS Name,
        p.description AS Description,
        p.short_description AS ShortDescription,
        p.category_id AS CategoryId,
        p.company_id AS CompanyId,
        p.rate AS Rate,
        p.brand_id AS BrandId,
        p.manufacturer_id AS ManufacturerId,
        p.hs_code AS HsCode,
        p.status AS Status,
        p.is_featured AS IsFeatured,
        p.seo_title AS SeoTitle,
        p.seo_description AS SeoDescription,
        p.attributes AS Attributes,
        p.created_by AS CreatedBy,
        p.created_at AS CreatedAt,

        pi.Id,
        pi.ProductId,
        pi.ImageName,
        pi.IsDefault,
        pi.CreatedAt

    FROM Products p
    LEFT JOIN ProductImages pi ON p.id = pi.ProductId
    WHERE p.id = @Id";

            var productDictionary = new Dictionary<int, ProductModel>();

            var result = await _db.QueryAsync<ProductModel, ProductImageModel, ProductModel>(
                sql,
                (product, image) =>
                {
                    if (!productDictionary.TryGetValue(product.Id, out var productEntry))
                    {
                        productEntry = product;
                        productEntry.Images = new List<ProductImageModel>();
                        productDictionary.Add(productEntry.Id, productEntry);
                    }

                    if (image != null)
                        productEntry.Images.Add(image);

                    return productEntry;
                },
                new { Id = id },
                splitOn: "Id"
            );

            return productDictionary.Values.FirstOrDefault();
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
         rate, hs_code, status, is_featured, seo_title, seo_description, attributes,
         created_by, created_at, updated_at)
        VALUES
        (@CompanyId, @Sku, @Name, @Description, @ShortDescription, @CategoryId, @BrandId, @ManufacturerId,
         @Rate, @HsCode, @Status, @IsFeatured, @SeoTitle, @SeoDescription, @Attributes,
         @CreatedBy, SYSDATETIME(), SYSDATETIME());

        SELECT CAST(SCOPE_IDENTITY() AS INT);
    ";

            return await _db.ExecuteScalarAsync<int>(sql, product);
        }

        public async Task<bool> UpdateAsync(ProductModel product)
        {
            await GenerateSkuAndSeoAsync(product);

            var parameters = new DynamicParameters();
            var setClauses = new List<string>();

            if (!string.IsNullOrEmpty(product.Sku))
            {
                setClauses.Add("sku = @Sku");
                parameters.Add("@Sku", product.Sku);
            }

            if (!string.IsNullOrEmpty(product.Name))
            {
                setClauses.Add("name = @Name");
                parameters.Add("@Name", product.Name);
            }

            if (!string.IsNullOrEmpty(product.Description))
            {
                setClauses.Add("description = @Description");
                parameters.Add("@Description", product.Description);
            }

            if (product.CategoryId > 0)
            {
                setClauses.Add("category_id = @CategoryId");
                parameters.Add("@CategoryId", product.CategoryId);
            }

            if (product.BrandId > 0)
            {
                setClauses.Add("brand_id = @BrandId");
                parameters.Add("@BrandId", product.BrandId);
            }

            if (product.ManufacturerId > 0)
            {
                setClauses.Add("manufacturer_id = @ManufacturerId");
                parameters.Add("@ManufacturerId", product.ManufacturerId);
            }

            setClauses.Add("rate = @Rate");
            parameters.Add("@Rate", product.Rate);

            if (!string.IsNullOrEmpty(product.HsCode))
            {
                setClauses.Add("hs_code = @HsCode");
                parameters.Add("@HsCode", product.HsCode);
            }

            if (!string.IsNullOrEmpty(product.Status))
            {
                setClauses.Add("status = @Status");
                parameters.Add("@Status", product.Status);
            }

            if (product.IsFeatured.HasValue)
            {
                setClauses.Add("is_featured = @IsFeatured");
                parameters.Add("@IsFeatured", product.IsFeatured);
            }

            if (!string.IsNullOrEmpty(product.SeoTitle))
            {
                setClauses.Add("seo_title = @SeoTitle");
                parameters.Add("@SeoTitle", product.SeoTitle);
            }

            if (!string.IsNullOrEmpty(product.SeoDescription))
            {
                setClauses.Add("seo_description = @SeoDescription");
                parameters.Add("@SeoDescription", product.SeoDescription);
            }

            if (!string.IsNullOrEmpty(product.Attributes))
            {
                setClauses.Add("attributes = @Attributes");
                parameters.Add("@Attributes", product.Attributes);
            }

            // Always update timestamp
            setClauses.Add("updated_at = @UpdatedAt");
            parameters.Add("@UpdatedAt", DateTime.UtcNow);

            parameters.Add("@Id", product.Id);

            var sql = $@"
        UPDATE [NepalDistributers].[dbo].[products]
        SET {string.Join(", ", setClauses)}
        WHERE id = @Id";

            return (await _db.ExecuteAsync(sql, parameters)) > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var sql = "DELETE FROM [NepalDistributers].[dbo].[products] WHERE id=@Id";
            return (await _db.ExecuteAsync(sql, new { Id = id })) > 0;
        }
        public async Task<long> AddCatagoryAsync(CreateCategoryDto dto, string? imageUrl)
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

            long? parentId = dto.ParentId;

            while (parentId != null)
            {
                var parent = await _db.QueryFirstOrDefaultAsync<CreateCategoryDto>(
                    "SELECT name, parent_id FROM product_categories WHERE Id = @Id",
                    new { Id = parentId });

                if (parent == null)
                    break;
                parentId = parent.ParentId;
            }

            // Step 3: Insert with stored procedure
            var p = new DynamicParameters();
            p.Add("@name", dto.Name);
            p.Add("@slug", dto.Slug);
            p.Add("@parent_id", dto.ParentId);
            p.Add("@image_url", imageUrl); // NEW: pass image name to SP
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
        public async Task<bool> UpdateCategoryAsync(int id, CreateCategoryDto dto, string? imageUrl)
        {
            try
            {

                // 🔹 Check exists
                var exists = await _db.ExecuteScalarAsync<int>(
                    "SELECT COUNT(1) FROM dbo.Product_Categories WHERE id = @Id",
                    new { Id = id });

                if (exists == 0)
                    throw new Exception("Category not found");

                // 🔹 Duplicate check
                if (!string.IsNullOrEmpty(dto.Name))
                {
                    var duplicate = await _db.ExecuteScalarAsync<int>(
                        @"SELECT COUNT(1)
              FROM dbo.Product_Categories
              WHERE name = @Name
              AND ISNULL(parent_id,0) = ISNULL(@ParentId,0)
              AND id <> @Id",
                        new
                        {
                            Name = dto.Name,
                            ParentId = dto.ParentId,
                            Id = id
                        });

                    if (duplicate > 0)
                        throw new Exception("Category already exists under same parent");
                }

                // 🔹 Build update
                var parameters = new DynamicParameters();
                var setClauses = new List<string>();

                if (!string.IsNullOrEmpty(dto.Name))
                {
                    setClauses.Add("name = @Name");
                    parameters.Add("@Name", dto.Name);
                }

                if (!string.IsNullOrEmpty(dto.Slug))
                {
                    setClauses.Add("slug = @Slug");
                    parameters.Add("@Slug", dto.Slug);
                }

                if (dto.ParentId.HasValue)
                {
                    setClauses.Add("parent_id = @ParentId");
                    parameters.Add("@ParentId", dto.ParentId);
                }

                if (!string.IsNullOrEmpty(imageUrl))
                {
                    setClauses.Add("imageUrl = @ImageUrl"); // ⚠️ FIX THIS COLUMN NAME
                    parameters.Add("@ImageUrl", imageUrl);
                }

                if (!setClauses.Any())
                    throw new Exception("No fields to update");

                setClauses.Add("updated_at = SYSUTCDATETIME()");

                parameters.Add("@Id", id);

                var sql = $@"
        UPDATE dbo.Product_Categories
        SET {string.Join(", ", setClauses)}
        WHERE id = @Id";

                var rows = await _db.ExecuteAsync(sql, parameters);

                return rows > 0;
            }
            catch (Exception ex)
            {

                throw;
            }
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

        public async Task InsertProductImagesAsync(int productId, List<ProductImageModel> images)
        {
            var sql = @"
        INSERT INTO ProductImages (ProductId, ImageName, IsDefault, CreatedAt)
        VALUES (@ProductId, @ImageName, @IsDefault, GETUTCDATE())";

            foreach (var image in images)
            {
                await _db.ExecuteAsync(sql, new
                {
                    ProductId = productId,
                    ImageName = image.ImageName,
                    IsDefault = image.IsDefault
                });
            }
        }
        public async Task DeleteProductImagesByIdsAsync(int productId, List<int> imageIds)
        {
            var query = "DELETE FROM ProductImages WHERE ProductId = @ProductId AND Id IN @ImageIds";
            await _db.ExecuteAsync(query, new { ProductId = productId, ImageIds = imageIds });
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