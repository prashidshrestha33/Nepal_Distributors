using Marketpalce.Repository.Repositories.ProductRepo;
using Marketplace.Model.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
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

        private static readonly ConcurrentDictionary<Guid, ImportJobInfo> Jobs = new();

        public ImportController(IProductRepository productRepo, ILogger<ImportController> logger)
        {
            _productRepo = productRepo;
            _logger = logger;
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

            _ = Task.Run(async () =>
            {
                job.Status = ImportStatus.Running;
                try
                {
                    if (ext == ".csv")
                        await ProcessCsvAsync(tempFile, job);
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

        private async Task ProcessCsvAsync(string filePath, ImportJobInfo job)
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
                    var record = MapFields(headers, fields);

                    if (record == null)
                        job.Errors.Enqueue($"Line {lineNumber}: missing required fields.");
                    else
                        await _productRepo.CreateAsync(record);
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

        private ProductModel? MapFields(string[] headers, IList<string> fields)
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < headers.Length && i < fields.Count; i++)
                dict[headers[i]] = fields[i];

            if (!dict.TryGetValue("name", out var name) || string.IsNullOrWhiteSpace(name))
                return null;

            var product = new ProductModel
            {
                Sku = dict.GetValueOrDefault("sku"),
                Name = name,
                Description = dict.GetValueOrDefault("description"),
                ShortDescription = dict.GetValueOrDefault("short_description"),
                Rate = decimal.TryParse(dict.GetValueOrDefault("rate"), out var r) ? r : 0,
                Status = dict.GetValueOrDefault("status") ?? "pending_approval",
                Attributes = dict.GetValueOrDefault("attributes"),
                ImageName = dict.GetValueOrDefault("image_name"),
                CreatedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return product;
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
