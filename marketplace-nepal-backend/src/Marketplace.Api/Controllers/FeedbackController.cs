using Marketplace.Api.Services.FeedbackService;
using Marketplace.Model.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Marketplace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbackController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        [HttpPost("submit")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubmitFeedback([FromForm] FeedbackSubmitRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { error = "Feedback data is required." });
            }

            try
            {
                string uniqueFileName = null;
                if (request.Screenshot != null && request.Screenshot.Length > 0)
                {
                    const long MaxFileBytes = 5 * 1024 * 1024; // 5 MB
                    if (request.Screenshot.Length > MaxFileBytes)
                        return BadRequest(new { error = "File too large." });

                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                    var ext = Path.GetExtension(request.Screenshot.FileName).ToLowerInvariant();

                    if (Array.IndexOf(allowedExtensions, ext) == -1)
                        return BadRequest(new { error = "Invalid file type. Only JPG, PNG are allowed." });

                    uniqueFileName = $"{Guid.NewGuid()}{ext}";
                    var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "FeedbackFiles");

                    if (!Directory.Exists(uploadPath))
                        Directory.CreateDirectory(uploadPath);

                    var filePath = Path.Combine(uploadPath, uniqueFileName);
                    using var fs = new FileStream(filePath, FileMode.Create);
                    await request.Screenshot.CopyToAsync(fs);
                }

                var feedback = new Feedback
                {
                    UserId = request.UserId,
                    CompanyId = request.CompanyId,
                    Subject = request.Subject,
                    Message = request.Message,
                    FileName = uniqueFileName
                };

                var id = await _feedbackService.CreateFeedbackAsync(feedback);

                return Ok(new
                {
                    success = true,
                    message = "Feedback submitted successfully.",
                    id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to submit feedback.",
                    details = ex.Message
                });
            }
        }

        [HttpGet("inbox")]
        [Authorize] // Admin only maybe
        public async Task<IActionResult> GetInboxFeedbacks()
        {
            var feedbacks = await _feedbackService.GetAllFeedbacksAsync();
            return Ok(feedbacks);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetFeedbackDetails(long id)
        {
            var feedback = await _feedbackService.GetFeedbackByIdAsync(id);
            if (feedback == null)
                return NotFound(new { error = "Feedback not found." });

            return Ok(feedback);
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _feedbackService.GetCategoriesAsync();
            return Ok(categories);
        }
    }

    public class FeedbackSubmitRequest
    {
        public long? UserId { get; set; }
        public long? CompanyId { get; set; }
        public string Subject { get; set; }
        public string Message { get; set; }
        public IFormFile Screenshot { get; set; }
    }
}
