using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketplace.Model.Models
{
    public class ProductModel
    {
        public int Id { get; set; }
        public string? Sku { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string? ShortDescription { get; set; }
        public int CategoryId { get; set; }
        public string? CompanyName { get; set; }
        public int? CompanyId { get; set; }
        public int? Credit { get; set; }
        public int BrandId { get; set; }
        public int ManufacturerId { get; set; }
        public decimal Rate { get; set; }
        public string? HsCode { get; set; }
        public string? Status { get; set; }
        public bool? IsFeatured { get; set; } = true;
        public string? SeoTitle { get; set; }
        public string? SeoDescription { get; set; }
        public string? Attributes { get; set; }
        public string? ImageName { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ApproveFg { get; set; }
        public DateTime? ApproveTs { get; set; }
    }
}
