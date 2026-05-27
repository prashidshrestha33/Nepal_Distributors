using Dapper;
using Marketplace.Model.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // Public access for the homepage storefront
    public class HomepageController : ControllerBase
    {
        private readonly IDbConnection _db;

        public HomepageController(IDbConnection db)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        [HttpGet]
        public async Task<IActionResult> GetHomepageData()
        {
            try
            {
                // 1. Fetch all static values along with their catalog metadata in one go
                const string staticValuesSql = @"
                    SELECT 
                        s.static_id as StaticId, 
                        s.Catalog_id as CatalogId, 
                        s.static_value AS StaticValueKey, 
                        s.static_data AS StaticData, 
                        s.display_order as DisplayOrder, 
                        c.Catalog_Name as CatalogName, 
                        c.Catalog_Type as CatalogType,
                        c.CatalogTitle,
                        c.KeyTitle,
                        c.DataTitle
                    FROM dbo.static_value s 
                    JOIN dbo.static_value_cataglog c ON s.Catalog_id = c.Catalog_id
                    WHERE c.Catalog_Name IN ('AboutUs', 'HeroBanners', 'Services', 'ContactInfo', 'Brand')
                    ORDER BY s.display_order ASC;";

                var staticValues = (await _db.QueryAsync<dynamic>(staticValuesSql)).ToList();

                // Group static values by CatalogName in memory
                var heroBanners = staticValues
                    .Where(x => x.CatalogName == "HeroBanners")
                    .Select(x => new {
                        imageUrl = x.StaticValueKey,
                        caption = x.StaticData,
                        displayOrder = x.DisplayOrder
                    })
                    .ToList();

                var aboutUsRaw = staticValues.FirstOrDefault(x => x.CatalogName == "AboutUs");
                var aboutUs = aboutUsRaw != null ? new {
                    imageUrl = aboutUsRaw.StaticValueKey,
                    description = aboutUsRaw.StaticData
                } : null;

                var services = staticValues
                    .Where(x => x.CatalogName == "Services")
                    .Select(x => new {
                        title = x.StaticValueKey,
                        description = x.StaticData,
                        displayOrder = x.DisplayOrder
                    })
                    .ToList();

                var contactInfo = staticValues
                    .Where(x => x.CatalogName == "ContactInfo")
                    .ToDictionary(
                        x => ((string)x.StaticValueKey).ToLower(),
                        x => (string)x.StaticData
                    );

                // Group brand partners
                var brands = staticValues
                    .Where(x => x.CatalogName == "Brand")
                    .Select(x => new {
                        name = x.StaticValueKey,
                        logo = x.StaticData // Note: we'll check if logo is null/empty and provide visual default on UI
                    })
                    .ToList();

                // 2. Fetch featured parent categories (depth = 0)
                const string categoriesSql = @"
                    SELECT 
                        id AS Id, 
                        name AS Name, 
                        slug AS Slug, 
                        parent_id AS ParentId, 
                        depth AS Depth, 
                        imageUrl as Image, 
                        ActiveFlag AS ActiveFlag
                    FROM dbo.Product_Categories
                    WHERE depth = 0 AND ActiveFlag = 1
                    ORDER BY name ASC;";

                var categories = await _db.QueryAsync<dynamic>(categoriesSql);

                // 3. Fetch top 8 featured/latest products with default images
                const string productsSql = @"
                    SELECT TOP 8 
                        p.id AS Id, 
                        p.sku AS Sku, 
                        p.name AS Name, 
                        p.description AS Description, 
                        p.short_description AS ShortDescription,
                        p.category_id AS CategoryId, 
                        p.rate AS Rate, 
                        p.ActiveFlag,
                        c.name AS CompanyName,
                        (SELECT TOP 1 ImageName FROM ProductImages WHERE ProductId = p.id ORDER BY IsDefault DESC, CreatedAt ASC) AS DefaultImage
                    FROM Products p
                    LEFT JOIN Companies c ON p.company_id = c.id
                    WHERE p.ActiveFlag = 1 AND (UPPER(p.status) = 'APPROVED' OR p.approve_fg = '1' OR p.status IS NULL)
                    ORDER BY p.created_at DESC;";

                var products = await _db.QueryAsync<dynamic>(productsSql);

                // Assemble the complete homepage dataset
                var response = new
                {
                    heroBanners,
                    aboutUs,
                    services,
                    categories,
                    products,
                    brands,
                    contactInfo
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred fetching homepage data.", details = ex.Message });
            }
        }
    }
}
