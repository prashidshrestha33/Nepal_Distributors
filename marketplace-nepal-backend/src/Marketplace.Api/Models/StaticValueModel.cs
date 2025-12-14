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
        public string CatalogId { get; set; }    // Maps to static_value
        public string StaticValueKey { get; set; }    // Maps to static_value
        public string StaticData { get; set; }        // Maps to static_data
    }
}
