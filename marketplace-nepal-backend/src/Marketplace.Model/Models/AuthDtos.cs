using System.ComponentModel.DataAnnotations;

namespace Marketplace.Models
{

    public class CompanyCreateRequest
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public long? CompanyId { get; set; }
        public string? CompamyPerson { get; set; }
        public string? MobilePhone { get; set; }
        public string? LandLinePhone { get; set; }
        public string? RegistrationDocument { get; set; }
        public string? CompanyType { get; set; }
        public string? UserType { get; set; }
        public long? Credits { get; set; }
        public string? Tire { get; set; }
        public string? Status { get; set; }
        public string? Address { get; set; }
        public string? GoogleMapLocation { get; set; }
    }
    public class ApproveCompanyRequest
    {
        public long CompanyId { get; set; }
        public string? AssignCategory { get; set; }
        public string ApproveFg { get; set; } = "Y";
        public string? RejectComment { get; set; }  // optional
    }
    public class ProductDecisionRequest
    {
        public string Action { get; set; }  // "Approve" or "Reject"
        public string? Remarks { get; set; }
    }

    public class NewRegisterRequest
    {
        public RegisterRequest? user { get; set; }
        // Optional company payload to create during registration
        public CompanyCreateRequest? Company { get; set; }
    }

    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public long? CompanyId { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
        public long? Credits { get; set; }
        public string? Tier { get; set; }
        public string? Provider { get; set; }
        public string? ID { get; set; }
        public string? Token { get; set; }
    }

    public class LoginRequest
    {
        public string id { get; set; } = string.Empty;
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string Photo { get; set; } = string.Empty;
    }
    public class ForgetPwdRequest
    {
        [Required]
        public string Password { get; set; } = string.Empty;
        [Required]
        public string Token { get; set; } = string.Empty;
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