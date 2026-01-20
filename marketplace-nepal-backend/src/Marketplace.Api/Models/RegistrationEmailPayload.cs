using Marketplace.Models;

namespace Marketplace.Api.Models
{
    public class RegistrationEmailPayload
    {
        public string CompanyId { get; set; }
        public string CompanyEmail { get; set; }
        public string CompanyName { get; set; }

        public DateTime Expiry { get; set; }
    }
}
