using System.Text.Json.Serialization;

namespace Marketplace.Api.Models
{
    public class StaticValueCatalogModel
    {
        public string CatalogName { get; set; }
        public string CatalogType { get; set; }
        public string CatalogDescription { get; set; }
    }

    public class StaticValueModel
    {
        [JsonPropertyName("staticId")]
        public int? StaticId { get; set; }

        [JsonPropertyName("catalogId")]
        public int CatalogId { get; set; }

        [JsonPropertyName("staticValueKey")]
        public string StaticValueKey { get; set; }

        [JsonPropertyName("staticData")]
        public string StaticData { get; set; }

        [JsonPropertyName("displayOrder")]
        public int? DisplayOrder { get; set; }
    }
}
