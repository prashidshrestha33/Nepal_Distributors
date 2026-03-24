using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketplace.Model.Models
{

 
     public class OrderModel
    {
        public long Id { get; set; }
        public string? OrderNumber { get; set; }
        public long? BuyerCompanyId { get; set; }
        public long? SellerCompanyId { get; set; }
        public long? CreatedBy { get; set; }
        public string? Status { get; set; }
        public DateTime? RequiredByDate { get; set; }
        public string? ShippingAddress { get; set; }
        public decimal ShippingCharge { get; set; }
        public decimal VatAmount { get; set; }
        public decimal GrandTotal { get; set; }
        public string? Remarks { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }
    public class OrderItemModel
    {
        public long Id { get; set; }
        public long OrderId { get; set; }
        public long ProductId { get; set; } // Note: Your Angular JSON used "product_id"
        public string? ProductName { get; set; } 
        public decimal Quantity { get; set; }
        public decimal UnitRate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Remarks { get; set; }
    }
    public class OrderRequestDto : OrderModel
    {
        public List<OrderItemModel>? Items { get; set; }
    }
    public class OrderDetailsDto
    {
        public OrderModel? Order { get; set; }
        public List<OrderItemModel>? Items { get; set; }
    }
}
