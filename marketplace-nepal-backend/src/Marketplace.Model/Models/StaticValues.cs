using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketplace.Model.Models
{
    public class StaticValueCatalog
    {
        public long CatalogId { get; set; }
        public string CatalogName { get; set; }
        public string CatalogType { get; set; }
        public string CatalogDescription { get; set; }
    }

    public class StaticValue
    {
        public string CatalogId { get; set; }    // Maps to static_value
        public string StaticValueKey { get; set; }    // Maps to static_value
        public string StaticData { get; set; }        // Maps to static_data
    }
}
