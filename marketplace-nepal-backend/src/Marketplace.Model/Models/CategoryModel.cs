using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketplace.Model.Models
{
    public class CreateCategoryDto
    {
        public string Name { get; set; } = "";
        public string? Slug { get; set; }
        public long? ParentId { get; set; }
    }
    public class MoveCategoryDto
    {
        public long CategoryId { get; set; }
        public long? NewParentId { get; set; }
    }
    public class CategoryDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = "";
        public string Slug { get; set; } = "";
        public long? ParentId { get; set; }
        public short Depth { get; set; }
        public List<CategoryDto> Children { get; set; } = new List<CategoryDto>();
    }
}
