using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Marketplace.Api.DOTModels;

namespace Marketplace.Api.Services.Helper
{
    public class DelegateHaldelerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<DelegateHaldelerMiddleware> _logger;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        // Max buffer to avoid buffering very large responses (1 MB default)
        private const long MaxBufferSizeBytes = 1 * 1024 * 1024;

        public DelegateHaldelerMiddleware(RequestDelegate next, ILogger<DelegateHaldelerMiddleware> logger)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // EARLY BYPASS: don't touch swagger endpoints, static files, health checks, or the favicon
            var path = context.Request.Path.Value ?? string.Empty;
            if (path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/favicon.ico", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/health", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/robots.txt", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            _logger.LogDebug("DelegateHaldelerMiddleware - Entering request {Method} {Path}", context.Request.Method, context.Request.Path);

            var originalBodyStream = context.Response.Body;
            await using var buffer = new MemoryStream();
            context.Response.Body = buffer;

            try
            {
                await _next(context);

                // If the response has a known large content-length and exceeds our buffer limit, forward without wrapping
                if (context.Response.ContentLength.HasValue && context.Response.ContentLength.Value > MaxBufferSizeBytes)
                {
                    buffer.Seek(0, SeekOrigin.Begin);
                    context.Response.Body = originalBodyStream;
                    await buffer.CopyToAsync(originalBodyStream);
                    _logger.LogDebug("DelegateHaldelerMiddleware - Skipped wrapping due to Content-Length > MaxBufferSize");
                    return;
                }

                // If buffer is already larger than allowed, forward raw
                if (buffer.Length > MaxBufferSizeBytes)
                {
                    buffer.Seek(0, SeekOrigin.Begin);
                    context.Response.Body = originalBodyStream;
                    await buffer.CopyToAsync(originalBodyStream);
                    _logger.LogDebug("DelegateHaldelerMiddleware - Skipped wrapping because buffer exceeded MaxBufferSize");
                    return;
                }

                // Read the downstream response body
                context.Response.Body.Seek(0, SeekOrigin.Begin);
                var responseBodyText = await new StreamReader(context.Response.Body, Encoding.UTF8).ReadToEndAsync();

                // Detect JSON responses (if content type not set or contains application/json)
                var contentType = context.Response.ContentType ?? string.Empty;
                var isJson = string.IsNullOrEmpty(contentType) ||
                             contentType.IndexOf("application/json", StringComparison.OrdinalIgnoreCase) >= 0;

                // Don't wrap non-JSON responses (files, images, HTML pages, etc.)
                if (!isJson)
                {
                    context.Response.Body.Seek(0, SeekOrigin.Begin);
                    await buffer.CopyToAsync(originalBodyStream);
                    context.Response.Body = originalBodyStream;
                    _logger.LogDebug("DelegateHaldelerMiddleware - Forwarding non-JSON response without wrapping. ContentType={ContentType}", contentType);
                    return;
                }

                // If the body is empty, produce a standard ApiResponse with no result
                if (string.IsNullOrWhiteSpace(responseBodyText))
                {
                    var apiEmpty = ApiResponse.Create(context.Response.StatusCode, null, GetDefaultMessageForStatus(context.Response.StatusCode));
                    var apiJson = JsonSerializer.Serialize(apiEmpty, _jsonOptions);
                    var bytes = Encoding.UTF8.GetBytes(apiJson);
                    context.Response.Body = originalBodyStream;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.ContentLength = bytes.Length;
                    await context.Response.Body.WriteAsync(bytes, 0, bytes.Length);
                    _logger.LogDebug("DelegateHaldelerMiddleware - Returned wrapped empty response. StatusCode={StatusCode}", context.Response.StatusCode);
                    return;
                }

                // Detect if already ApiResponse-like (avoid double wrapping)
                bool alreadyWrapped = false;
                object resultPayload = null;

                try
                {
                    using var doc = JsonDocument.Parse(responseBodyText);
                    var root = doc.RootElement;
                    if (root.ValueKind == JsonValueKind.Object)
                    {
                        if (root.TryGetProperty("statusCode", out _) || root.TryGetProperty("success", out _) || root.TryGetProperty("message", out _))
                        {
                            alreadyWrapped = true;
                        }
                        else
                        {
                            resultPayload = root.Clone();
                        }
                    }
                    else
                    {
                        resultPayload = root.Clone();
                    }
                }
                catch (JsonException)
                {
                    // Not valid JSON; embed raw string as result if JSON content type indicated (rare)
                    resultPayload = responseBodyText;
                }

                if (alreadyWrapped)
                {
                    // Return original body unchanged
                    context.Response.Body.Seek(0, SeekOrigin.Begin);
                    await buffer.CopyToAsync(originalBodyStream);
                    context.Response.Body = originalBodyStream;
                    _logger.LogDebug("DelegateHaldelerMiddleware - Response already wrapped, forwarded original body");
                    return;
                }

                // Build ApiResponse and write it
                var statusCode = context.Response.StatusCode;
                var message = GetDefaultMessageForStatus(statusCode);
                var apiResponse = ApiResponse.Create(statusCode, resultPayload, message);
                var outJson = JsonSerializer.Serialize(apiResponse, _jsonOptions);
                var outBytes = Encoding.UTF8.GetBytes(outJson);

                context.Response.Body = originalBodyStream;
                context.Response.ContentType = "application/json; charset=utf-8";
                context.Response.ContentLength = outBytes.Length;
                await context.Response.Body.WriteAsync(outBytes, 0, outBytes.Length);

                _logger.LogDebug("DelegateHaldelerMiddleware - Response wrapped into ApiResponse. StatusCode={StatusCode}", statusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception while processing request {Method} {Path}", context.Request.Method, context.Request.Path);

                if (!context.Response.HasStarted)
                {
                    context.Response.Clear();
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    context.Response.ContentType = "application/json; charset=utf-8";

                    var errorResponse = ApiResponse.Error("An unexpected error occurred.", new[] { ex.Message });
                    var json = JsonSerializer.Serialize(errorResponse, _jsonOptions);
                    await context.Response.WriteAsync(json);
                }
                else
                {
                    _logger.LogWarning("Response already started, cannot return error body.");
                }

                // Re-throw so global exception middleware can also observe it, if you have one.
                throw;
            }
            finally
            {
                if (context.Response.Body != originalBodyStream)
                {
                    context.Response.Body = originalBodyStream;
                }

                _logger.LogDebug("DelegateHaldelerMiddleware - Leaving request {Method} {Path}", context.Request.Method, context.Request.Path);
            }
        }

        private static string GetDefaultMessageForStatus(int status)
        {
            return status switch
            {
                200 => "OK",
                201 => "Created",
                202 => "Accepted",
                204 => "No Content",
                400 => "Bad Request",
                401 => "Unauthorized",
                403 => "Forbidden",
                404 => "Not Found",
                409 => "Conflict",
                500 => "An error occurred",
                _ => null,
            };
        }
    }
}