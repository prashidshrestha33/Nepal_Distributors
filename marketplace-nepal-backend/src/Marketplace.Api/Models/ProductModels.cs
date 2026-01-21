using System.Text.Json.Serialization;

namespace Marketplace.Api.Models
{
    public class ProductModels
    {
        public string? Sku { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string? ShortDescription { get; set; }
        public int CategoryId { get; set; }
        public int BrandId { get; set; }
        public int ManufacturerId { get; set; }
        public decimal Rate { get; set; }
        public string HsCode { get; set; }
        public string Status { get; set; }
        public bool? IsFeatured { get; set; }
        public string SeoTitle { get; set; }
        public string SeoDescription { get; set; }
        public string? Attributes { get; set; }
        public string CreatedBy { get; set; }
        public IFormFile? ImageFile { get; set; }
    }
}
