import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../services/management/management.service';
import type { Order } from '../../../../services/management/management.service';

@Component({
  selector: 'app-pending-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-orders.component.html',
  styleUrls: []
})
export class PendingOrdersComponent implements OnInit {
  items: Order[] = [];
  filteredItems: Order[] = [];
  searchTerm = '';
  loading = false;
  releasingId: number | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.orderService.getOrders('pending').subscribe({
      next: (data: Order[]) => {
        this.items = data;
        this.filteredItems = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading pending orders:', err);
        this.errorMessage = 'Failed to load pending orders.';
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.filteredItems = this.items.filter(i =>
      i.orderNumber.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  release(id: number) {
    if (confirm('Are you sure you want to release this order to sellers? This will notify them to submit quotes.')) {
      this.releasingId = id;
      this.successMessage = '';
      this.errorMessage = '';
      
      this.orderService.updateOrderStatus(id, 'processing').subscribe({
        next: () => {
          this.successMessage = 'Order released successfully!';
          this.releasingId = null;
          this.load();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          console.error('Error releasing order:', err);
          this.errorMessage = 'Failed to release order. Please try again.';
          this.releasingId = null;
        }
      });
    }
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this pending order?')) {
      this.orderService.deleteOrder(id).subscribe({
        next: () => {
          this.load();
        },
        error: (err) => {
          console.error('Error deleting order:', err);
          alert('Failed to delete order.');
        }
      });
    }
  }
}
