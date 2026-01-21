using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Models
{
    public class ComponieCommonModel
    {
        public RegisterRequestCommonModel Register {get; set; }
        public CompanyCreateRequestCommonModel Company { get; set; }
        public IFormFile CompanyDocument { get; set; }
    }
    public class RegisterRequestCommonModel
    {
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; } 
        public string? Provider { get; set; } 
        public string? ID { get; set; } 
        public string? Token { get; set; }
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Role { get; set; }
        public string? Tier { get; set; }
    }
    public class CompanyCreateRequestCommonModel
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public string? CompamyPerson { get; set; }
        [Required]
        public string? MobilePhone { get; set; }
        [Required]
        public string? LandLinePhone { get; set; }
        [Required]
        public string? CompanyType { get; set; }
        [Required]
        public string? Address { get; set; }
        [Required]
        public string? GoogleMapLocation { get; set; }
    }
}
