using System.ComponentModel.DataAnnotations;

namespace Marketplace.Models
{
    public class CompanyCreateRequest
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        public string? CompanyType { get; set; }
        public string? RegistrationDocument { get; set; }
        public string? Address { get; set; }
        public string? GoogleMapLocation { get; set; }
    }

    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public long? CompanyId { get; set; }

        // Optional company payload to create during registration
        public CompanyCreateRequest? Company { get; set; }

        public string? Role { get; set; }
        public string? Status { get; set; }
        public long? Credits { get; set; }
        public string? Tier { get; set; }
    }

    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class GoogleLoginRequest
    {
        [Required]
        public string IdToken { get; set; } = string.Empty;
    }

    public class FacebookLoginRequest
    {
        [Required]
        public string AccessToken { get; set; } = string.Empty;
    }

    public class CompanyCreatedResponse
    {
        public CompanyCreatedResponse(long id) => Id = id;
        public long Id { get; }
    }
}