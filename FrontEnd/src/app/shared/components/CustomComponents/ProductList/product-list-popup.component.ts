import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductService, Category, CategoryService } from '../../../services/management/management.service';
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
  categories: Category[] = [];
  expandedCategories = new Set<number>();
  selectedCategoryId: number | null = null;
  loading = true;

  selectedItemsMap = new Map<number, any>();

  searchFilters = {
    name: '',
    brand: '',
    category: '',
    status: ''
  };

  // Custom Request Form State
  showCustomRequest = false;
  customProduct = {
    name: '',
    quantity: 1,
    unit: 'pcs',
    description: '',
    categoryId: 1
  };
  customProductImage: File | null = null;
  customProductImagePreview: string | null = null;
  submittingCustom = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) { }

  ngOnInit(): void {
    // 1. Populate Memory Map with pre-selected items passed from Parent
    if (this.preSelectedItems && this.preSelectedItems.length > 0) {
      this.preSelectedItems.forEach(item => {
        this.selectedItemsMap.set(item.productId, item);
      });
    }

    this.loadCategories();

    if (this.companyId) {
      this.loadProducts();
    } else {
      this.loading = false;
    }
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        // Default custom category to the first category if available
        if (cats && cats.length > 0) {
          this.customProduct.categoryId = cats[0].id;
        }
      },
      error: (err) => {
        console.error('Error loading categories', err);
      }
    });
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
      
      // Category match: either selectedCategoryId is null, or matches exactly, or matches subcategories
      let categoryMatch = true;
      if (this.selectedCategoryId) {
        categoryMatch = p.categoryId === this.selectedCategoryId || this.isSubcategoryOf(p.categoryId, this.selectedCategoryId);
      }

      const statusMatch = !this.searchFilters.status || p.status?.toLowerCase().includes(this.searchFilters.status.toLowerCase());
      return nameMatch && brandMatch && categoryMatch && statusMatch;
    });
  }

  isSubcategoryOf(prodCatId: number, selectedId: number): boolean {
    const findAndCheck = (cats: Category[]): boolean => {
      for (const cat of cats) {
        if (cat.id === selectedId) {
          return cat.children?.some(c => c.id === prodCatId || (c.children && this.isSubcategoryOf(prodCatId, c.id))) || false;
        }
        if (cat.children && cat.children.length > 0) {
          if (findAndCheck(cat.children)) return true;
        }
      }
      return false;
    };
    return findAndCheck(this.categories);
  }

  selectCategory(catId: number | null): void {
    this.selectedCategoryId = catId;
    this.applyFilters();
  }

  toggleCategoryExpand(catId: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.expandedCategories.has(catId)) {
      this.expandedCategories.delete(catId);
    } else {
      this.expandedCategories.add(catId);
    }
  }

  isCategoryExpanded(catId: number): boolean {
    return this.expandedCategories.has(catId);
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
        unit_rate: product.price || product.rate || 0,
        total_amount: product.price || product.rate || 0,
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
  // CUSTOM PRODUCT REQUEST FLOW
  // ===============================
  openCustomRequestForm() {
    this.showCustomRequest = true;
    this.resetCustomProductForm();
  }

  closeCustomRequestForm() {
    this.showCustomRequest = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.customProductImage = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.customProductImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile() {
    this.customProductImage = null;
    this.customProductImagePreview = null;
  }

  addCustomRequest() {
    if (!this.customProduct.name || this.customProduct.name.trim() === '') {
      alert('Product name is required.');
      return;
    }

    this.submittingCustom = true;

    // Create a new product payload matching what AddProduct expects
    const newProductPayload: Product = {
      id: 0,
      name: this.customProduct.name,
      description: this.customProduct.description || 'Custom request item',
      defaultImage: '',
      categoryId: this.customProduct.categoryId,
      brandId: 0,
      manufacturerId: 0,
      rate: 0, // Custom items don't have catalog prices
      hsCode: '',
      status: 'Pending',
      categoryName: '',
      categorySlug: '',
      seoTitle: this.customProduct.name,
      seoDescription: this.customProduct.description || 'Custom request item',
      activeFlag: true,
      createdBy: ''
    };

    const images = this.customProductImage 
      ? [{ file: this.customProductImage, isDefault: true }] 
      : [];

    this.productService.createProduct(newProductPayload, images).subscribe({
      next: (createdProduct: any) => {
        // Map the created product to the cart item format
        const orderItemFormat = {
          productId: createdProduct.id,
          productName: createdProduct.name,
          quantity: this.customProduct.quantity,
          unit_rate: 0,
          total_amount: 0,
          remarks: this.customProduct.description,
          unit: this.customProduct.unit
        };

        // Add to selected map
        this.selectedItemsMap.set(createdProduct.id, orderItemFormat);

        // Reset and close
        this.showCustomRequest = false;
        this.submittingCustom = false;
        this.resetCustomProductForm();
        
        // Reload products list so the custom product is indexed locally
        this.loadProducts();
      },
      error: (err) => {
        console.error('Error adding custom product:', err);
        alert('Failed to add custom product. Please try again.');
        this.submittingCustom = false;
      }
    });
  }

  resetCustomProductForm() {
    this.customProduct = {
      name: '',
      quantity: 1,
      unit: 'pcs',
      description: '',
      categoryId: this.categories.length > 0 ? this.categories[0].id : 1
    };
    this.customProductImage = null;
    this.customProductImagePreview = null;
    this.submittingCustom = false;
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
    const findName = (cats: Category[]): string => {
      for (const cat of cats) {
        if (cat.id === categoryId) return cat.name;
        if (cat.children && cat.children.length > 0) {
          const name = findName(cat.children);
          if (name !== 'Category ' + categoryId) return name;
        }
      }
      return 'Category ' + categoryId;
    };
    return findName(this.categories);
  }

  getBrandName(brandId: number): string {
    return 'Brand ' + brandId;
  }

  closePopup(): void {
    this.close.emit();
  }
}
