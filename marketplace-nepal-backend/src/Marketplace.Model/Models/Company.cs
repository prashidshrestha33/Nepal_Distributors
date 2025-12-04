using System;

namespace Marketplace.Models
{
    public class Company
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;

        // Contact details
        public string? ContactPerson { get; set; }
        public string? MobilePhone { get; set; }
        public string? LandlinePhone { get; set; }

        // Documents / registration
        public string? RegistrationDocument { get; set; }

        // Classification
        public string? CompanyType { get; set; }

        // Status / user type
        public string? Status { get; set; }
        public string? UserType { get; set; }

        // Credits / Tier
        public long Credits { get; set; } = 0;
        public string? Tier { get; set; }

        // Location
        public string? Location { get; set; }
        // For simplicity in C# keep as string; repositories map to geography column as text or handle conversion externally
        public string? GoogleMapLocation { get; set; }

        public string? ApproveDt { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
        public string? ApproveTs { get; set; }
    }
}