using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketplace.Model.Models
{
    public class CompanyNotificationSettingsDto
    {
        public long CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public bool NotifyFg { get; set; }
        public List<CategoryNotificationDto> Categories { get; set; } = new();
    }
    public class CategoryNotificationDto
    {
        public long CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string? ImageUrl { get; set; }
        public bool PushNotification { get; set; }
    }
    public class UpdateNotificationSettingsRequest
    {
        public long CompanyId { get; set; }
        public bool NotifyFg { get; set; }
        public List<CategoryNotificationDto>? Categories { get; set; }
    }
}
