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

  @Input() companyId!: number;
  @Input() productListStyle: 'table' | 'list' | 'scroll' = 'table';
  @Input() keyWord: string = '';
  @Input() displayMode: 'popup' | 'flat' = 'popup';
  @Input() preSelectedItems: any[] = []; 

  @Output() close = new EventEmitter<void>();
  @Output() productSelected = new EventEmitter<any[]>(); // Emits an Array of Order Items

  products: any[] = [];
  filteredProducts: any[] = [];
  loading = true;

  selectedItemsMap = new Map<number, any>();

  searchFilters = {
    name: '',
    brand: '',
    category: '',
    status: ''
  };

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    debugger;
    // 1. Populate Memory Map with pre-selected items passed from Parent
    if (this.preSelectedItems && this.preSelectedItems.length > 0) {
      this.preSelectedItems.forEach(item => {
        // Ensure we store it using the actual product_id as the key
        this.selectedItemsMap.set(item.productId, item);
      });
    }

    if (this.companyId) {
      this.loadProducts();
    } else {
      this.loading = false;
    }
  }

  loadProducts(): void {
    this.loading = true;

    this.productService.SearchProducts(this.keyWord || '').subscribe({
      next: (response: any) => {
        const result = response?.data || [];

        this.products = result.map((p: Product) => ({
          ...p,
          imageUrl: this.getImageUrl((p as any).defaultImage),
          
          // 2. Automatically check the box if it exists in our Memory Map!
          selected: this.selectedItemsMap.has(p.id) 
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

  applyFilters(): void {
    this.filteredProducts = this.products.filter(p => {
      const nameMatch = !this.searchFilters.name || p.name?.toLowerCase().includes(this.searchFilters.name.toLowerCase());
      const brandMatch = !this.searchFilters.brand || this.getBrandName(p.brandId)?.toLowerCase().includes(this.searchFilters.brand.toLowerCase());
      const categoryMatch = !this.searchFilters.category || this.getCategoryName(p.categoryId)?.toLowerCase().includes(this.searchFilters.category.toLowerCase());
      const statusMatch = !this.searchFilters.status || p.status?.toLowerCase().includes(this.searchFilters.status.toLowerCase());
      return nameMatch && brandMatch && categoryMatch && statusMatch;
    });
  }

  // ===============================
  // TOGGLE MULTI-SELECTION
  // ===============================
  toggleSelection(product: any): void {
    product.selected = !product.selected;

    if (product.selected) {
      // Create the exact JSON format expected by the Order Service
      const orderItemFormat = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit_rate: product.price || 0,
        total_amount: product.price || 0,
        remarks: ''
      };
      
      // Save to map
      this.selectedItemsMap.set(product.id, orderItemFormat);
    } else {
      // Remove from map if user unchecks the box
      this.selectedItemsMap.delete(product.id);
    }
  }

  // ===============================
  // CONFIRM AND EMIT ARRAY
  // ===============================
  confirmSelection(): void {
    // Extract everything currently in the map into a clean array
    const allSelectedArray = Array.from(this.selectedItemsMap.values());

    // Emit array of items back to parent
    this.productSelected.emit(allSelectedArray);

    if (this.displayMode === 'popup') {
      this.closePopup();
    }
  }

  // ===============================
  // HELPERS
  // ===============================
  getImageUrl(imageName?: string): string {
    return imageName 
      ? `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(imageName)}`
      : 'assets/images/no-image.png';
  }

  getCategoryName(categoryId: number): string {
    return 'Category ' + categoryId;
  }

  getBrandName(brandId: number): string {
    return 'Brand ' + brandId;
  }

  closePopup(): void {
    this.close.emit();
  }
}
