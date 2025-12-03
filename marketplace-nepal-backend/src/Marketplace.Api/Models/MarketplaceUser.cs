using System;

namespace Marketplace.Api.Models
{
    public class MarketplaceUser
    {
        public long Id { get; set; }
        public long? CompanyId { get; set; }
        public string? Email { get; set; }
        public string? PasswordHash { get; set; }
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
        public long Credits { get; set; }
        public string? Tier { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public DateTimeOffset? LastLoginAt { get; set; }

        // Social provider ids (new)
        public string? GoogleId { get; set; }
        public string? FacebookId { get; set; }
    }
}