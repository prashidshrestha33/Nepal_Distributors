using Marketplace.Model.Models;

namespace Marketplace.Api.Models
{
    public class Order
    {
        public long Id { get; set; }
        public string OrderNumber { get; set; }
        public long? BuyerCompanyId { get; set; }
        public long? SellerCompanyId { get; set; }
        public long? CreatedBy { get; set; }
        public string Status { get; set; }
        public DateTime? RequiredByDate { get; set; }
        public string ShippingAddress { get; set; }
        public decimal ShippingCharge { get; set; }
        public decimal VatAmount { get; set; }
        public decimal GrandTotal { get; set; }
        public string Remarks { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public string ApproveDt { get; set; }
        public DateTimeOffset? ApproveTs { get; set; }
    }
    public class OrderItem
    {
        public long Id { get; set; }
        public long OrderId { get; set; }
        public long? ProductId { get; set; }
        public string ProductName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitRate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Remarks { get; set; }
    }
    public class OrderRequest
    {
        public long? Id { get; set; } // Required for Update operations
        public string OrderNumber { get; set; }
        public long? BuyerCompanyId { get; set; }
        public long? SellerCompanyId { get; set; }
        public long? CreatedBy { get; set; }
        public string Status { get; set; }
        public DateTime? RequiredByDate { get; set; }
        public string ShippingAddress { get; set; }
        public decimal ShippingCharge { get; set; }
        public decimal VatAmount { get; set; }
        public decimal GrandTotal { get; set; }
        public string Remarks { get; set; }
        public List<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
    // Used to return complete order with its items to the Frontend
    public class OrderDetails
    {
        public Order Order { get; set; }
        public List<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
   

}
