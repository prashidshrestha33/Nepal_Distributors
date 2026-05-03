using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Marketplace.Model.Models
{
    public class StaticValueCatalog
    {
        public long CatalogId { get; set; }
        public string CatalogName { get; set; }
        public string CatalogType { get; set; }
        public string CatalogDescription { get; set; }
        public string CatalogTitle { get; set; }
        public string KeyTitle { get; set; }
        public string DataTitle { get; set; }
    }

    public class StaticValue
    {
        public int? StaticId { get; set; }
        public int CatalogId { get; set; }
        public string StaticValueKey { get; set; }
        public string StaticData { get; set; }
        public int? DisplayOrder { get; set; }
        public string CatalogTitle { get; set; }
        public string KeyTitle { get; set; }
        public string DataTitle { get; set; }
    }
    public class StaticValueFilter
    {
        public string? staticId { get; set; }
        public string? catalogId { get; set; }
        public string? catalogkey { get; set; }
        public string? key { get; set; }
    }
}
