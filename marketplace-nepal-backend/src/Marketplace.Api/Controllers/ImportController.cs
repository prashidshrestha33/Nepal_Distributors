using Marketpalce.Repository.Repositories.ProductRepo;
using Marketplace.Model.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Concurrent;
using System.Data;
using System.Globalization;
using System.Security.Claims;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImportController : ControllerBase
    {
        private readonly IProductRepository _productRepo;
        private readonly ILogger<ImportController> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        private static readonly ConcurrentDictionary<Guid, ImportJobInfo> Jobs = new();

        public ImportController(IProductRepository productRepo, ILogger<ImportController> logger, IServiceScopeFactory scopeFactory)
        {
            _productRepo = productRepo;
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        // 🔥 IMPORTANT: Swagger now supports this (multipart/form-data)
        [HttpPost("products")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status202Accepted)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ImportProducts([FromForm] ImportProductsRequest request)
        {
            var file = request.File;
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "No file uploaded" });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".csv" && ext != ".xlsx" && ext != ".xls")
                return BadRequest(new { error = "Only CSV and Excel files are supported (.csv, .xlsx, .xls)" });

            var jobId = Guid.NewGuid();
            var tempFile = Path.Combine(Path.GetTempPath(), $"{jobId}{ext}");

            await using (var fs = System.IO.File.Create(tempFile))
            {
                await file.CopyToAsync(fs);
            }

            var job = new ImportJobInfo
            {
                Id = jobId,
                FileName = file.FileName,
                CreatedAt = DateTimeOffset.UtcNow,
                Status = ImportStatus.Queued,
                Errors = new ConcurrentQueue<string>(),
                Total = 0,
                Processed = 0
            };

            Jobs[jobId] = job;

            var createdBy = User?.FindFirst("emailaddress")?.Value
                ?? User?.FindFirst(ClaimTypes.Email)?.Value
                ?? "system";


            _ = Task.Run(async () =>
            {
                job.Status = ImportStatus.Running;
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var repo = scope.ServiceProvider.GetRequiredService<IProductRepository>();
                    var db = scope.ServiceProvider.GetRequiredService<IDbConnection>();

                    if (ext == ".csv")
                        await ProcessCsvAsync(tempFile, job, repo, db, createdBy);
                    else
                    {
                        job.Errors.Enqueue("Excel import not implemented yet.");
                        job.Status = ImportStatus.Failed;
                    }

                    if (job.Status != ImportStatus.Failed)
                        job.Status = ImportStatus.Completed;
                }
                catch (Exception ex)
                {
                    job.Errors.Enqueue($"Unhandled exception: {ex.Message}");
                    _logger.LogError(ex, "Import job {JobId} failed", jobId);
                    job.Status = ImportStatus.Failed;
                }
                finally
                {
                    job.CompletedAt = DateTimeOffset.UtcNow;
                    try { System.IO.File.Delete(tempFile); } catch { }
                }
            });

            var statusUrl = Url.Action(nameof(GetJobStatus), new { id = jobId });
            return Accepted(statusUrl!, new { jobId, statusUrl });
        }

        [HttpGet("status/{id:guid}")]
        public IActionResult GetJobStatus([FromRoute] Guid id)
        {
            if (!Jobs.TryGetValue(id, out var job)) return NotFound(new { error = "Job not found" });

            return Ok(new
            {
                job.Id,
                job.FileName,
                Status = job.Status.ToString(),
                job.Total,
                job.Processed,
                Errors = job.Errors.ToArray(),
                job.CreatedAt,
                job.CompletedAt
            });
        }

        private async Task ProcessCsvAsync(string filePath, ImportJobInfo job, IProductRepository repo, IDbConnection db, string createdBy)
        {
            int total = 0;
            using (var srCount = new StreamReader(filePath))
            {
                while (await srCount.ReadLineAsync() != null) total++;
            }
            if (total > 0) total--;
            job.Total = total;

            using var sr = new StreamReader(filePath);
            var headerLine = await sr.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(headerLine))
            {
                job.Errors.Enqueue("Empty CSV or missing header.");
                job.Status = ImportStatus.Failed;
                return;
            }

            var headers = ParseCsvLine(headerLine).Select(h => h.Trim().ToLowerInvariant()).ToArray();
            string? line;
            int lineNumber = 1;

            while ((line = await sr.ReadLineAsync()) != null)
            {
                lineNumber++;
                if (string.IsNullOrWhiteSpace(line))
                {
                    job.Processed++;
                    continue;
                }

                try
                {
                    var fields = ParseCsvLine(line);
                    var record = await MapFields(headers, fields, createdBy, repo, db);

                    if (record == null)
                        job.Errors.Enqueue($"Line {lineNumber}: missing required fields.");
                    else
                        await repo.CreateAsync(record);
                }
                catch (Exception ex)
                {
                    job.Errors.Enqueue($"Line {lineNumber} error: {ex.Message}");
                }
                finally
                {
                    job.Processed++;
                }
            }
        }

        private async Task<ProductModel?> MapFields(string[] headers, IList<string> fields, string createdBy, IProductRepository repo, IDbConnection db)
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < headers.Length && i < fields.Count; i++)
                dict[headers[i]] = fields[i];

            if (!dict.TryGetValue("name", out var name) || string.IsNullOrWhiteSpace(name))
                return null;

            var product = new ProductModel
            {
                CompanyId = dict.GetValueOrDefault("company_id") != null
                  ? int.Parse(dict.GetValueOrDefault("company_id"))
                  : null,
                Sku = dict.GetValueOrDefault("sku"),
                Name = name,
                Description = dict.GetValueOrDefault("description"),
                ShortDescription = dict.GetValueOrDefault("short_description"),
                // category may come as ID or name; try numeric first, else lookup by name (case-insensitive)
                CategoryId = 0,
                BrandId = 0,
                ManufacturerId = dict.GetValueOrDefault("manufacturer_id") != null
                  ? int.Parse(dict.GetValueOrDefault("manufacturer_id"))
                  : 0,
                Rate = decimal.TryParse(dict.GetValueOrDefault("rate"), out var r) ? r : 0,
                HsCode = dict.GetValueOrDefault("hs_code") ?? "",
                Status = dict.GetValueOrDefault("status") ?? "pending_approval",
                IsFeatured = ParseBoolean(dict.GetValueOrDefault("is_featured")),
                SeoTitle = name, // product name
                SeoDescription = GenerateSeoDescription(dict.GetValueOrDefault("description")), // intelligent trim
                Attributes = dict.GetValueOrDefault("attributes"),
                ImageName = dict.GetValueOrDefault("ImageName"),
                CreatedBy = createdBy,
                ProductAdded = dict.GetValueOrDefault("product_added") != null
                    ? int.Parse(dict.GetValueOrDefault("product_added"))
                    : null,
                CreatedAt = dict.GetValueOrDefault("created_at") != null
                  ? DateTime.Parse(dict.GetValueOrDefault("created_at"))
                  : DateTime.UtcNow,
                UpdatedAt = dict.GetValueOrDefault("updated_at") != null
                  ? DateTime.Parse(dict.GetValueOrDefault("updated_at"))
                  : DateTime.UtcNow
            };
            // Resolve CategoryId
            var catVal = dict.GetValueOrDefault("category_id");
            if (!string.IsNullOrWhiteSpace(catVal))
            {
                if (int.TryParse(catVal, out var cid))
                {
                    product.CategoryId = cid;
                }
                else
                {
                    // try lookup by name (case-insensitive)
                    try
                    {
                        var catId = await db.QueryFirstOrDefaultAsync<long?>(
                            "SELECT TOP 1 id FROM dbo.Product_Categories WHERE LOWER(name) = LOWER(@Name);",
                            new { Name = catVal.Trim() }
                        );
                        product.CategoryId = (int?)(catId ?? 0) ?? 0;
                    }
                    catch
                    {
                        product.CategoryId = 0;
                    }
                }
            }

            // Resolve BrandId similarly (static_value table under Brand catalog)
            var brandVal = dict.GetValueOrDefault("brand_id") ?? dict.GetValueOrDefault("brand");
            if (!string.IsNullOrWhiteSpace(brandVal))
            {
                if (int.TryParse(brandVal, out var bid))
                {
                    product.BrandId = bid;
                }
                else
                {
                    try
                    {
                        var brandId = await db.QueryFirstOrDefaultAsync<long?>(
                            @"SELECT TOP 1 s.static_id
                              FROM dbo.static_value s
                              INNER JOIN dbo.static_value_cataglog c ON s.Catalog_id = c.Catalog_id
                              WHERE LOWER(c.Catalog_Name) = LOWER('Brand')
                                AND LOWER(s.static_value) = LOWER(@Value);",
                            new { Value = brandVal.Trim() }
                        );
                        product.BrandId = (int?)(brandId ?? 0) ?? 0;
                    }
                    catch
                    {
                        product.BrandId = 0;
                    }
                }
            }

            return product;
        }
        // Helper function to generate SEO description
        string GenerateSeoDescription(string? description, int maxLength = 100)
        {
            if (string.IsNullOrWhiteSpace(description))
                return "";

            // Try to cut at the first period, exclamation, or question mark
            int sentenceEnd = description.IndexOfAny(new[] { '.', '!', '?' });
            if (sentenceEnd > 0 && sentenceEnd + 1 <= maxLength)
            {
                return description.Substring(0, sentenceEnd + 1).Trim();
            }

            // If no punctuation or too long, just take up to maxLength
            return description.Length > maxLength
                ? description.Substring(0, maxLength).Trim() + "..."
                : description.Trim();
        }
// Helper method
        private bool ParseBoolean(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return true; // default if null

            value = value.Trim().ToLower();
            return value == "1" || value == "true" || value == "yes";
        }

        private static List<string> ParseCsvLine(string line)
        {
            var result = new List<string>();
            if (line == null) return result;

            int i = 0;
            while (i < line.Length)
            {
                if (line[i] == '"')
                {
                    i++;
                    var sb = new System.Text.StringBuilder();
                    while (i < line.Length && line[i] != '"')
                        sb.Append(line[i++]);
                    i += 2;
                    result.Add(sb.ToString());
                }
                else
                {
                    var start = i;
                    while (i < line.Length && line[i] != ',') i++;
                    result.Add(line[start..i]);
                    i++;
                }
            }
            return result;
        }

        private class ImportJobInfo
        {
            public Guid Id { get; set; }
            public string FileName { get; set; }
            public ImportStatus Status { get; set; }
            public int Total { get; set; }
            public int Processed { get; set; }
            public ConcurrentQueue<string> Errors { get; set; }
            public DateTimeOffset CreatedAt { get; set; }
            public DateTimeOffset? CompletedAt { get; set; }
        }

        private enum ImportStatus
        {
            Queued,
            Running,
            Completed,
            Failed
        }
        public class ImportProductsRequest
        {
            [FromForm]
            public IFormFile File { get; set; }

        }

    }
}
