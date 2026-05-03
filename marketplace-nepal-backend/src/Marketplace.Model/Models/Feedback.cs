using System;

namespace Marketplace.Model.Models
{
    public class Feedback
    {
        public long Id { get; set; }
        public long? UserId { get; set; }
        public long? CompanyId { get; set; }
        public string Subject { get; set; }
        public string Message { get; set; }
        public string FileName { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        
        // Joined fields
        public string FullName { get; set; }
        public string Email { get; set; }
    }

    public class FeedbackCategoryDto
    {
        public long StaticValueId { get; set; }
        public string Value { get; set; }
    }
}
