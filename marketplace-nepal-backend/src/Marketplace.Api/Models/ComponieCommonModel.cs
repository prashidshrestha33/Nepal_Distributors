using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Models
{
    public class ComponieCommonModel
    {
        public RegisterRequestCommonModel Register {get; set; }
        public CompanyCreateRequestCommonModel Company { get; set; }
        public string? Token { get; set; }
        public IFormFile CompanyDocument { get; set; }
    }
    public class UserCommonModel
    {
        public RegisterRequestCommonModel Register { get; set; }
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
        public string? Name { get; set; }
        public string? CompamyPerson { get; set; }
        public string? MobilePhone { get; set; }
        public string? LandLinePhone { get; set; }
        public string? CompanyType { get; set; }
        public string? Address { get; set; }
        public string? GoogleMapLocation { get; set; }
    }
    public class CompanyDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string ContactPerson { get; set; }
        public string MobilePhone { get; set; }
        public string LandlinePhone { get; set; }
        public string CompanyType { get; set; }
        public string Tier { get; set; }
        public string Location { get; set; }
        public string GoogleMapLocation { get; set; }
        public string Status { get; set; }
        public int Credits { get; set; }
    }

}
