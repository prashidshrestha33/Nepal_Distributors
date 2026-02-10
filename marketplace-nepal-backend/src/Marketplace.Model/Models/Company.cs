using System;

namespace Marketplace.Models
{
    public class Company
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string ContactPerson { get; set; }
        public string MobilePhone { get; set; }
        public string LandlinePhone { get; set; }
        public string RegistrationDocument { get; set; }
        public string CompanyType { get; set; }
        public string Status { get; set; }
        public string UserType { get; set; }
        public int Credits { get; set; }
        public string Tier { get; set; }
        public string Location { get; set; }
        public string GoogleMapLocation { get; set; }
        public DateTimeOffset? CreatedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }
        public DateTimeOffset? ApproveDt { get; set; }
        public TimeSpan? ApproveTs { get; set; }
        public string ApproveFg { get; set; }
        public string RejectComment { get; set; }
    }
    public class UpdateCompanyFieldRequest
    {
        public long CompanyId { get; set; }
        public string FieldName { get; set; }
        public string FieldValue { get; set; }
        public string UpdatedBy { get; set; }
        public string Value { get; set; }
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