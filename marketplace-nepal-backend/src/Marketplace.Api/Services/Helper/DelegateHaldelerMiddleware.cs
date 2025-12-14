using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Marketplace.Api.Models;

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

            // Use a buffer to capture downstream output
            await using var buffer = new MemoryStream();
            context.Response.Body = buffer;

            try
            {
                // Invoke downstream middleware / MVC
                await _next(context);

                // If downstream set a large content-length, or our buffer exceeded limit, forward raw
                if (context.Response.ContentLength.HasValue && context.Response.ContentLength.Value > MaxBufferSizeBytes)
                {
                    _logger.LogDebug("DelegateHaldelerMiddleware - Skipping wrap due to Content-Length > MaxBufferSize");
                    await ForwardBufferAsync(buffer, originalBodyStream);
                    return;
                }

                if (buffer.Length > MaxBufferSizeBytes)
                {
                    _logger.LogDebug("DelegateHaldelerMiddleware - Skipping wrap because buffer exceeded MaxBufferSize");
                    await ForwardBufferAsync(buffer, originalBodyStream);
                    return;
                }

                // Read captured response
                buffer.Seek(0, SeekOrigin.Begin);
                var responseBodyText = await new StreamReader(buffer, Encoding.UTF8).ReadToEndAsync();

                // Detect JSON responses by Content-Type or by content start
                var contentType = context.Response.ContentType ?? string.Empty;
                var isJsonByContentType = !string.IsNullOrEmpty(contentType) && contentType.IndexOf("application/json", StringComparison.OrdinalIgnoreCase) >= 0;
                var startsWithJsonChar = false;
                for (int i = 0; i < responseBodyText.Length; i++)
                {
                    var ch = responseBodyText[i];
                    if (char.IsWhiteSpace(ch)) continue;
                    startsWithJsonChar = ch == '{' || ch == '[';
                    break;
                }

                var isJson = isJsonByContentType || startsWithJsonChar;

                // Don't wrap non-JSON responses (files, images, HTML pages, etc.)
                if (!isJson)
                {
                    _logger.LogDebug("DelegateHaldelerMiddleware - Forwarding non-JSON response without wrapping. ContentType={ContentType}", contentType);
                    // Copy buffer to original stream
                    await ForwardBufferAsync(buffer, originalBodyStream);
                    return;
                }

                // If the body is empty, produce a standard ApiResponse with no result
                if (string.IsNullOrWhiteSpace(responseBodyText))
                {
                    var apiEmpty = ApiResponse.Create(context.Response.StatusCode, null, GetDefaultMessageForStatus(context.Response.StatusCode));
                    var apiJson = JsonSerializer.Serialize(apiEmpty, _jsonOptions);
                    await WriteStringToOriginalAsync(originalBodyStream, apiJson, context);
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
                            resultPayload = root.Clone(); // JsonElement
                        }
                    }
                    else
                    {
                        // array or primitive
                        resultPayload = root.Clone();
                    }
                }
                catch (JsonException)
                {
                    // Not valid JSON; embed raw string as result
                    resultPayload = responseBodyText;
                }

                if (alreadyWrapped)
                {
                    _logger.LogDebug("DelegateHaldelerMiddleware - Response already wrapped, forwarding original body");
                    await ForwardBufferAsync(buffer, originalBodyStream);
                    return;
                }

                // Build ApiResponse and write it
                var statusCode = context.Response.StatusCode;
                var message = GetDefaultMessageForStatus(statusCode);
                var apiResponse = ApiResponse.Create(statusCode, resultPayload, message);
                var outJson = JsonSerializer.Serialize(apiResponse, _jsonOptions);

                await WriteStringToOriginalAsync(originalBodyStream, outJson, context);

                _logger.LogDebug("DelegateHaldelerMiddleware - Response wrapped into ApiResponse. StatusCode={StatusCode}", statusCode);
            }
            catch (Exception ex)
            {
                // Log and return a standardized error; do NOT attempt to write if response already started.
                _logger.LogError(ex, "Unhandled exception while processing request {Method} {Path}", context.Request.Method, context.Request.Path);

                if (!context.Response.HasStarted)
                {
                    context.Response.Clear();
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    context.Response.ContentType = "application/json; charset=utf-8";

                    var errorResponse = ApiResponse.Error("An unexpected error occurred.", new[] { ex.Message });
                    var json = JsonSerializer.Serialize(errorResponse, _jsonOptions);
                    await WriteStringToOriginalAsync(originalBodyStream, json, context);
                }
                else
                {
                    _logger.LogWarning("Response already started, cannot return error body.");
                }

                // Do not rethrow — we've handled the response here.
            }
            finally
            {
                // Always restore the original response body stream
                context.Response.Body = originalBodyStream;
                _logger.LogDebug("DelegateHaldelerMiddleware - Leaving request {Method} {Path}", context.Request.Method, context.Request.Path);
            }
        }

        private static async Task ForwardBufferAsync(MemoryStream buffer, Stream originalStream)
        {
            buffer.Seek(0, SeekOrigin.Begin);
            await buffer.CopyToAsync(originalStream);
            await originalStream.FlushAsync();
        }

        private static async Task WriteStringToOriginalAsync(Stream originalStream, string json, HttpContext context)
        {
            var outBytes = Encoding.UTF8.GetBytes(json);
            // Ensure response headers reflect JSON; Content-Length optional (chunked is fine)
            context.Response.ContentType = "application/json; charset=utf-8";
            context.Response.ContentLength = outBytes.Length;

            // Write to original stream
            await originalStream.WriteAsync(outBytes, 0, outBytes.Length);
            await originalStream.FlushAsync();
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