import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductService } from '../../../services/management/management.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-product-list-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list-popup.component.html',
  styleUrls: ['./product-list-popup.component.css']
})
export class ProductListPopupComponent implements OnInit {

  // 🔹 Inputs
  @Input() companyId!: number;
  @Input() productListStyle: 'table' | 'list' | 'scroll' = 'table';
  @Input() keyWord: string = '';
  @Input() displayMode: 'popup' | 'flat' = 'popup';

  // 🔹 Output
  @Output() close = new EventEmitter<void>();

  // 🔹 State
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;

  // 🔹 Filters
  searchFilters = {
    name: '',
    brand: '',
    category: '',
    status: ''
  };

  constructor(private productService: ProductService) {}

  // ===============================
  // Init
  // ===============================
  ngOnInit(): void {
    if (this.companyId) {
      this.loadProducts();
    } else {
      this.loading = false;
    }
  }

  // ===============================
  // Load Products
  // ===============================
  loadProducts(): void {
    this.loading = true;

    this.productService.SearchProducts(this.keyWord || '').subscribe({
      next: (response: any) => {
        const result = response?.data || [];

        this.products = result.map((p: Product) => ({
          ...p,
          imageUrl: this.getImageUrl(p.imageName)
        }));

        this.applyFilters();
      },
      error: err => {
        console.error('Error loading products', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // ===============================
  // Filtering
  // ===============================
  applyFilters(): void {
    this.filteredProducts = this.products.filter(p => {

      const nameMatch =
        !this.searchFilters.name ||
        p.name?.toLowerCase().includes(this.searchFilters.name.toLowerCase());

      const brandMatch =
        !this.searchFilters.brand ||
        this.getBrandName(p.brandId)?.toLowerCase()
          .includes(this.searchFilters.brand.toLowerCase());

      const categoryMatch =
        !this.searchFilters.category ||
        this.getCategoryName(p.categoryId)?.toLowerCase()
          .includes(this.searchFilters.category.toLowerCase());

      const statusMatch =
        !this.searchFilters.status ||
        p.status?.toLowerCase()
          .includes(this.searchFilters.status.toLowerCase());

      return nameMatch && brandMatch && categoryMatch && statusMatch;
    });
  }

  // ===============================
  // Helpers
  // ===============================
  getImageUrl(imageName?: string): string {
    if (!imageName?.trim()) {
      return 'assets/images/no-image.png';
    }
    return `${environment.apiBaseUrl}/api/CompanyFile/${imageName.replace(/^\/+/, '')}`;
  }

  getCategoryName(categoryId: number): string {
    return 'Category ' + categoryId;
  }

  getBrandName(brandId: number): string {
    return 'Brand ' + brandId;
  }

  // ===============================
  // Close popup
  // ===============================
  closePopup(): void {
    this.close.emit();
  }
}