import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../services/management/management.service';
import type { Product } from '../../../../services/management/management.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  items: Product[] = [];
  filteredItems: Product[] = [];
  searchTerm = '';

  constructor(private service: ProductService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getProducts().subscribe((data: Product[]) => {
      this.items = data;
      this.filteredItems = data;
    });
  }

  onSearch() {
    this.filteredItems = this.items.filter(i =>
      i.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  approve(id: number) {
    this.service.approveProduct(id).subscribe(() => this.load());
  }

  delete(id: number) {
    if (confirm('Are you sure?')) {
      this.service.deleteProduct(id).subscribe(() => this.load());
    }
  }
}
