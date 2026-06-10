import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../../services/management/management.service';
import type { Order } from '../../../../services/management/management.service';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './track-order.component.html',
  styleUrl: './track-order.component.css'
})
export class TrackOrderComponent implements OnInit {
  orders: Order[] = [];
  selectedOrderId: number | null = null;
  orderDetails: any = null;
  loading = false;
  error: string | null = null;

  // Track steps status:
  steps = [
    { label: 'Order Placed', statusKey: 'pending', description: 'Your order has been submitted.' },
    { label: 'Approved', statusKey: 'approved', description: 'The order has been approved by the seller.' },
    { label: 'Shipped', statusKey: 'shipped', description: 'The order is on its way to your destination.' },
    { label: 'Delivered', statusKey: 'delivered', description: 'The order has been successfully delivered.' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    // Load list of orders for selection lookup
    this.loadOrdersList();

    // Check if ID is in the route parameter
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const id = Number(idStr);
        this.selectedOrderId = id;
        this.loadOrderDetails(id);
      }
    });
  }

  loadOrdersList() {
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data || [];
      },
      error: (err) => {
        console.error('Failed to load orders list', err);
      }
    });
  }

  onOrderSelect() {
    if (this.selectedOrderId) {
      this.router.navigate(['/management/orders/track', this.selectedOrderId]);
    } else {
      this.router.navigate(['/management/orders/track']);
      this.orderDetails = null;
    }
  }

  loadOrderDetails(id: number) {
    this.loading = true;
    this.error = null;
    this.orderDetails = null;

    this.orderService.getOrderById(id).subscribe({
      next: (details) => {
        this.orderDetails = details; // Expects { order: OrderModel, items: OrderItemModel[] }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching order details', err);
        this.error = 'Could not load order details. Please check the order ID.';
        this.loading = false;
      }
    });
  }

  isStepCompleted(stepKey: string): boolean {
    if (!this.orderDetails || !this.orderDetails.order) return false;
    const currentStatus = (this.orderDetails.order.status || '').toLowerCase();
    
    if (currentStatus === 'cancelled') return false;

    const statusPrecedence: { [key: string]: number } = {
      'pending': 1,
      'approved': 2,
      'shipped': 3,
      'delivered': 4
    };

    const currentRank = statusPrecedence[currentStatus] || 0;
    const stepRank = statusPrecedence[stepKey] || 0;

    return currentRank >= stepRank;
  }

  isStepActive(stepKey: string): boolean {
    if (!this.orderDetails || !this.orderDetails.order) return false;
    const currentStatus = (this.orderDetails.order.status || '').toLowerCase();
    return currentStatus === stepKey;
  }
}
