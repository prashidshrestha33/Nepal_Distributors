import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../services/management/management.service';
import type { Order } from '../../../../services/management/management.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  items: Order[] = [];
  filteredItems: Order[] = [];
  searchTerm = '';

  constructor(private service: OrderService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getOrders().subscribe((data: Order[]) => {
      this.items = data;
      this.filteredItems = data;
    });
  }

  onSearch() {
    this.filteredItems = this.items.filter(i =>
      i.orderNumber.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  approve(id: number) {
    this.service.approveOrder(id).subscribe(() => this.load());
  }

  delete(id: number) {
    if (confirm('Are you sure?')) {
      this.service.deleteOrder(id).subscribe(() => this.load());
    }
  }
}
