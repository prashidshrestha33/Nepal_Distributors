using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Marketplace.Model.Models
{
    public class QuotationRequestItemDto
    {
        public long OrderId { get; set; }
        public string ShippingAddress { get; set; }
        public string GoogleMapLocation { get; set; }
        public long OrderItemId { get; set; }
        public long ProductId { get; set; }
        public string ProductName { get; set; }
        public decimal RequestedQuantity { get; set; }
        public string Note { get; set; }
        public string ProductImageUrl { get; set; }
    }

    public class SubmitQuoteRequest
    {
        public long OrderId { get; set; }
        public long OrderItemId { get; set; }
        public long QuotedBy { get; set; } // The Seller's CompanyID
        public long ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitRate { get; set; }
        public decimal DeliveryCharge { get; set; }
        public string Notes { get; set; }
    }
    public class BulkQuoteItemDto
    {
        public long OrderId { get; set; }
        public long OrderItemId { get; set; }
        public long ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitRate { get; set; }
    }
    public class SentQuotationDto
    {
        public long QuoteId { get; set; }
        public string QuoteNumber { get; set; }
        public string ShippingAddress { get; set; }
        public string ProductName { get; set; }
        public string ProductImageUrl { get; set; }
        public decimal QuotedQuantity { get; set; }
        public decimal UnitRate { get; set; }
        public decimal DeliveryCharge { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }


    public class SubmitBulkQuoteRequest
    {
        public long QuotedBy { get; set; }
        public decimal DeliveryCharge { get; set; }
        public string Notes { get; set; }
        public List<BulkQuoteItemDto> Items { get; set; }
    }
    public class BuyerQuotationDashboardDto
    {
        public List<SentQuotationDto> Inbox { get; set; } = new();
        public List<SentQuotationDto> History { get; set; } = new();
    }
    public class SellerConfirmedOrderDto
    {
        public long OrderId { get; set; }
        public string PoNumber { get; set; }
        public string ShippingAddress { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public DateTimeOffset CreatedAt { get; set; }

        // This holds the child items inside the order card!
        public List<SellerConfirmedOrderItemDto> Items { get; set; } = new List<SellerConfirmedOrderItemDto>();
    }
    public class SellerConfirmedOrderItemDto
    {
        public long ItemId { get; set; }
        public string ProductName { get; set; }
        public string ProductImageUrl { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitRate { get; set; }
        public decimal ItemTotal { get; set; }
    }
}
