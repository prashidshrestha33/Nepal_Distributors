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
                // Ensure catalogs exist and seed default values
                await EnsureCatalogsAndSeedDataAsync();

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
                    WHERE c.Catalog_Name IN ('AboutUs', 'HeroBanners', 'Services', 'ContactInfo', 'Brand', 'Advertisements', 'PrivacyPolicy', 'TermsAndConditions', 'Testimonials', 'PremierBrands')
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
                        name = x.StaticData,
                        logo = x.StaticValueKey // Note: we'll check if logo is null/empty and provide visual default on UI
                    })
                    .ToList();

                // Group advertisements
                var advertisements = staticValues
                    .Where(x => x.CatalogName == "Advertisements")
                    .Select(x => new {
                        title = x.StaticData,
                        imageUrl = x.StaticValueKey,
                        displayOrder = x.DisplayOrder
                    })
                    .ToList();

                // Group Privacy Policy
                var privacyPolicy = staticValues
                    .Where(x => x.CatalogName == "PrivacyPolicy")
                    .Select(x => new {
                        title = x.StaticValueKey,
                        content = x.StaticData,
                        displayOrder = x.DisplayOrder
                    })
                    .ToList();

                // Group Terms and Conditions
                var termsAndConditions = staticValues
                    .Where(x => x.CatalogName == "TermsAndConditions")
                    .Select(x => new {
                        title = x.StaticValueKey,
                        content = x.StaticData,
                        displayOrder = x.DisplayOrder
                    })
                    .ToList();

                // Group Testimonials
                var testimonials = staticValues
                    .Where(x => x.CatalogName == "Testimonials")
                    .Select(x => new {
                        clientName = x.StaticValueKey,
                        testimonial = x.StaticData,
                        displayOrder = x.DisplayOrder
                    })
                    .ToList();

                // Group Premier Brands ("Trusted By Premier Brands" homepage section)
                var premierBrands = staticValues
                    .Where(x => x.CatalogName == "PremierBrands")
                    .Select(x => new {
                        name = x.StaticData,
                        logo = x.StaticValueKey, // logo image file name stored in static_value
                        displayOrder = x.DisplayOrder
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
                        p.is_featured AS IsFeatured,
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
                    contactInfo,
                    advertisements,
                    privacyPolicy,
                    termsAndConditions,
                    testimonials,
                    premierBrands
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred fetching homepage data.", details = ex.Message });
            }
        }

        private async Task EnsureCatalogsAndSeedDataAsync()
        {
            // Seed catalogs
            const string seedCatalogsSql = @"
                IF NOT EXISTS (SELECT 1 FROM dbo.static_value_cataglog WHERE Catalog_Name = 'Advertisements')
                BEGIN
                    INSERT INTO dbo.static_value_cataglog (Catalog_Name, Catalog_Type, Catalog_Description, CatalogTitle, KeyTitle, DataTitle)
                    VALUES ('Advertisements', 'Upload', 'Commercial supplier ads shown on the homepage sidebar', 'Advertisements', 'Ad Banner Image', 'Supplier Name');
                END

                IF NOT EXISTS (SELECT 1 FROM dbo.static_value_cataglog WHERE Catalog_Name = 'PrivacyPolicy')
                BEGIN
                    INSERT INTO dbo.static_value_cataglog (Catalog_Name, Catalog_Type, Catalog_Description, CatalogTitle, KeyTitle, DataTitle)
                    VALUES ('PrivacyPolicy', 'Homepage', 'Privacy Policy statements', 'Privacy Policy', 'Section Header', 'Section Content');
                END

                IF NOT EXISTS (SELECT 1 FROM dbo.static_value_cataglog WHERE Catalog_Name = 'TermsAndConditions')
                BEGIN
                    INSERT INTO dbo.static_value_cataglog (Catalog_Name, Catalog_Type, Catalog_Description, CatalogTitle, KeyTitle, DataTitle)
                    VALUES ('TermsAndConditions', 'Homepage', 'Terms and Conditions statements', 'Terms & Conditions', 'Section Header', 'Section Content');
                END

                IF NOT EXISTS (SELECT 1 FROM dbo.static_value_cataglog WHERE Catalog_Name = 'Testimonials')
                BEGIN
                    INSERT INTO dbo.static_value_cataglog (Catalog_Name, Catalog_Type, Catalog_Description, CatalogTitle, KeyTitle, DataTitle)
                    VALUES ('Testimonials', 'Homepage', 'What our clients say about us', 'Testimonials', 'Client Name', 'Client Testimonial');
                END

                IF NOT EXISTS (SELECT 1 FROM dbo.static_value_cataglog WHERE Catalog_Name = 'PremierBrands')
                BEGIN
                    INSERT INTO dbo.static_value_cataglog (Catalog_Name, Catalog_Type, Catalog_Description, CatalogTitle, KeyTitle, DataTitle)
                    VALUES ('PremierBrands', 'Upload', 'Trusted By Premier Brands logos shown on the homepage', 'Premier Brands', 'Brand Logo Image', 'Brand Name');
                END

                IF NOT EXISTS (SELECT 1 FROM dbo.static_value_cataglog WHERE Catalog_Name = 'Brand')
                BEGIN
                    INSERT INTO dbo.static_value_cataglog (Catalog_Name, Catalog_Type, Catalog_Description, CatalogTitle, KeyTitle, DataTitle)
                    VALUES ('Brand', 'Upload', 'Brand partners with logos displayed on the homepage Brand Partners section', 'Brand Partners', 'Brand Logo', 'Brand Name');
                END";

            await _db.ExecuteAsync(seedCatalogsSql);

            // Correct existing Advertisements catalog titles in case they were created under old names
            const string updateAdvertisementsCatalogSql = @"
                UPDATE dbo.static_value_cataglog
                SET KeyTitle = 'Ad Banner Image', DataTitle = 'Supplier Name'
                WHERE Catalog_Name = 'Advertisements' AND KeyTitle = 'Supplier Name';";
            await _db.ExecuteAsync(updateAdvertisementsCatalogSql);

            // Fix existing Brand catalog: ensure it has Upload type and correct column titles
            const string updateBrandCatalogSql = @"
                UPDATE dbo.static_value_cataglog
                SET Catalog_Type = 'Upload',
                    CatalogTitle = 'Brand Partners',
                    KeyTitle = 'Brand Logo',
                    DataTitle = 'Brand Name',
                    Catalog_Description = 'Brand partners with logos displayed on the homepage Brand Partners section'
                WHERE Catalog_Name = 'Brand' AND (Catalog_Type != 'Upload' OR KeyTitle IS NULL OR KeyTitle != 'Brand Logo');";
            await _db.ExecuteAsync(updateBrandCatalogSql);

            // Swap static_value and static_data for any homepage/upload catalogs where the image is in static_data
            const string swapMisalignedDataSql = @"
                UPDATE s
                SET s.static_value = s.static_data, s.static_data = s.static_value
                FROM dbo.static_value s
                JOIN dbo.static_value_cataglog c ON s.Catalog_id = c.Catalog_id
                WHERE (c.Catalog_Type = 'Homepage' OR c.Catalog_Type = 'Upload' OR c.Catalog_Type = 'hjomepage')
                  AND (
                      s.static_data LIKE 'http%' 
                      OR s.static_data LIKE '%.jpg' 
                      OR s.static_data LIKE '%.jpeg' 
                      OR s.static_data LIKE '%.png' 
                      OR s.static_data LIKE '%.webp' 
                      OR s.static_data LIKE '%.gif' 
                      OR s.static_data LIKE '%.svg' 
                      OR s.static_data LIKE '%.pdf'
                  );";
            await _db.ExecuteAsync(swapMisalignedDataSql);

            // Seed default values if empty
            var adsCatalogId = await _db.QueryFirstOrDefaultAsync<int?>("SELECT Catalog_id FROM dbo.static_value_cataglog WHERE Catalog_Name = 'Advertisements'");
            if (adsCatalogId.HasValue && !await _db.QueryFirstOrDefaultAsync<bool>("SELECT 1 FROM dbo.static_value WHERE Catalog_id = @Id", new { Id = adsCatalogId }))
            {
                await _db.ExecuteAsync(@"
                    INSERT INTO dbo.static_value (Catalog_id, static_value, static_data, display_order)
                    VALUES (@Id, 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600', 'Kathmandu Wholesale Traders', 1);", new { Id = adsCatalogId });
            }

            var privacyId = await _db.QueryFirstOrDefaultAsync<int?>("SELECT Catalog_id FROM dbo.static_value_cataglog WHERE Catalog_Name = 'PrivacyPolicy'");
            if (privacyId.HasValue && !await _db.QueryFirstOrDefaultAsync<bool>("SELECT 1 FROM dbo.static_value WHERE Catalog_id = @Id", new { Id = privacyId }))
            {
                await _db.ExecuteAsync(@"
                    INSERT INTO dbo.static_value (Catalog_id, static_value, static_data, display_order)
                    VALUES 
                    (@Id, '1. Data Collection', 'We collect business details such as company name, contact numbers, email address, physical address, and product catalogues to build your storefront profile in our directory.', 1),
                    (@Id, '2. Data Usage', 'Your listing data is made public to allow retail buyers to contact you for bulk quotes. We do not sell or share private account configurations with third parties.', 2),
                    (@Id, '3. Security Measures', 'We use standard encryption protocols (SSL/TLS) to secure user sessions and protect your stored credentials.', 3);", new { Id = privacyId });
            }

            var termsId = await _db.QueryFirstOrDefaultAsync<int?>("SELECT Catalog_id FROM dbo.static_value_cataglog WHERE Catalog_Name = 'TermsAndConditions'");
            if (termsId.HasValue && !await _db.QueryFirstOrDefaultAsync<bool>("SELECT 1 FROM dbo.static_value WHERE Catalog_id = @Id", new { Id = termsId }))
            {
                await _db.ExecuteAsync(@"
                    INSERT INTO dbo.static_value (Catalog_id, static_value, static_data, display_order)
                    VALUES 
                    (@Id, '1. Directory Listings', 'All distributors, wholesalers, and importers listed on this platform must provide accurate and verifiable business credentials.', 1),
                    (@Id, '2. Supplier and Buyer Negotiations', 'Nepal Distributors is a lead-generation directory and B2B platform. We do not process payments or take commission on transactions.', 2),
                    (@Id, '3. Intellectual Property', 'All content, branding, logos, and software code are the intellectual property of Nepal Distributors.', 3);", new { Id = termsId });
            }

            var testimonialsId = await _db.QueryFirstOrDefaultAsync<int?>("SELECT Catalog_id FROM dbo.static_value_cataglog WHERE Catalog_Name = 'Testimonials'");
            if (testimonialsId.HasValue && !await _db.QueryFirstOrDefaultAsync<bool>("SELECT 1 FROM dbo.static_value WHERE Catalog_id = @Id", new { Id = testimonialsId }))
            {
                await _db.ExecuteAsync(@"
                    INSERT INTO dbo.static_value (Catalog_id, static_value, static_data, display_order)
                    VALUES 
                    (@Id, 'Prashid Shrestha', 'Nepal Distributors helped our importing business connect directly with wholesalers in Pokhara and Biratnagar. Zero commission means better margins for everyone.', 1),
                    (@Id, 'Aayush Shrestha', 'Generating verified B2B leads has never been easier. We received multiple tailored quotes for our hotel supplies within a day.', 2);", new { Id = testimonialsId });
            }

            var premierBrandsId = await _db.QueryFirstOrDefaultAsync<int?>("SELECT Catalog_id FROM dbo.static_value_cataglog WHERE Catalog_Name = 'PremierBrands'");
            if (premierBrandsId.HasValue && !await _db.QueryFirstOrDefaultAsync<bool>("SELECT 1 FROM dbo.static_value WHERE Catalog_id = @Id", new { Id = premierBrandsId }))
            {
                await _db.ExecuteAsync(@"
                    INSERT INTO dbo.static_value (Catalog_id, static_value, static_data, display_order)
                    VALUES 
                    (@Id, '', 'Samsung', 1),
                    (@Id, '', 'Unilever', 2),
                    (@Id, '', 'Dabur Nepal', 3),
                    (@Id, '', 'CG Corp Global', 4),
                    (@Id, '', 'Surya Nepal', 5),
                    (@Id, '', 'Himalayan Snax', 6);", new { Id = premierBrandsId });
            }
        }
    }
}
