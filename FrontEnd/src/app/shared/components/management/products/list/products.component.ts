import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApproveProductComponent } from '../approve/approve-product.component';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../../../../services/management/management.service';
import type { Product } from '../../../../services/management/management.service';
import { Category } from '../../../../services/management/management.service';
import { CategoryService } from '../../../../services/management/management.service';
import { Users } from '../../../../services/management/management.service';
import { environment } from '../../../../../../environments/environment';


@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ApproveProductComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  // Modal state
  showApproveModal = false;
  approveProductData: (Product & { categoryName?: string; brandName?: string }) | null = null;
  approveStatus: string = 'Pending';
  users:Users[] = [];
  searchTerm = '';
  loading = false;
  form!: FormGroup;
  treeCategories: Category[] = [];
  cascadingDropdowns: Category[][] = [];
  dropdownLabels: string[] = [];
  loadingStates: boolean[] = [];
  selectedAtLevel: (number | null)[] = [];
  
  
  // Pagination properties
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;
  
  // Expose Math to template
  Math = Math;

  constructor(
    private productService: ProductService, 
    private router: Router,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef) {}
  ngOnInit() {
    this.loadProducts();
    this.loadCategoryTree();
    debugger;
    this.getImageUrl();
  }
    loadCategoryTree() {
      this.categoryService.getTreeCategories().subscribe({
        next: (tree: Category[]) => {
          
          this.treeCategories = tree;
          this.cascadingDropdowns[0] = tree;
          this.dropdownLabels[0] = 'Parent Category';
          this.loadingStates[0] = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Move form - Error loading category tree:', err);
          this.cdr.markForCheck();
        }
      });
    }
    
  // View product details
  viewProduct(product: Product) {
    if (product && product.id) {
      this.router.navigate(['/products', product.id]);
    }
  }

editProduct(product: Product) {
  if (product && product.id) this.router.navigate(['/products/edit', product.id]);
}

  removeProduct(product: Product) {
    // Open the same modal, but you can handle remove logic in the modal
    this.approveProductData = {
      ...product,
      categoryName: this.getCategoryName(product.categoryId),
      brandName: this.getBrandName(product.brandId)
    };
    this.showApproveModal = true;
  }

approveProduct(product: Product) {
  // Open modal with product details
  this.approveProductData = {
    ...product,
    categoryName: this.getCategoryName(product.categoryId),
    brandName: this.getBrandName(product.brandId)
  };
  this.approveStatus = product.status || 'Pending';
  this.showApproveModal = true;
}

onApproveSave(event: { status: string; reason?: string }) {
  if (!this.approveProductData) return;
  const updatedProduct: Product = { ...this.approveProductData, status: event.status };
  this.productService.updateProduct(updatedProduct.id, updatedProduct).subscribe({
    next: () => {
      // Update local table
      const idx = this.products.findIndex(p => p.id === updatedProduct.id);
      if (idx > -1) {
        this.products[idx].status = event.status;
      }
      this.filteredProducts = [...this.products];
      this.showApproveModal = false;
      alert(`Product "${updatedProduct.name}" status updated to ${event.status}.`);
    },
    error: err => {
      console.error('Error updating product status:', err);
      alert('Failed to update product status.');
    }
  });
}

onApproveCancel() {
  this.showApproveModal = false;
}
  loadProducts() {
  this.loading = true;

  this.productService.getProducts(this.currentPage, this.pageSize).subscribe({
    next: (response: any) => {
      // Use 'result' instead of 'data'
      this.products = response.result;
      this.filteredProducts = response.result;

      // Set totalCount and totalPages
      this.totalCount = response.result.length;
      this.totalPages = Math.ceil(this.totalCount / this.pageSize);

      this.loading = true;

      this.productService.getProducts(this.currentPage, this.pageSize).subscribe({
        next: (response: any) => {
         
          // Set totalCount and totalPages
          this.totalCount = this.filteredProducts.length;
          this.totalPages = Math.ceil(this.totalCount / this.pageSize);

          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading products:', err);
          this.loading = false;
        }
      });

      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading products:', err);
      this.loading = false;
    }
  });
}
  // Helper to get category name by ID
  getCategoryName(id: number | null | undefined): string {
  if (!id || id === 0) return 'N/A';
  const findCat = (cats: Category[]): string | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat.name;
      if (cat.children) {
        const found = findCat(cat.children);
        if (found) return found;
      }
    }
    return null;
  };
  return findCat(this.treeCategories) || 'N/A';
}

getBrandName(id: number | null | undefined): string {
  if (!id) return 'N/A';
  const brand = this.treeCategories.flatMap(c => c.children || []).find(b => b.id === id);
  return brand ? brand.name : `Brand-${id}`;
}

  onSearch() {
    this.filteredProducts = this.products
      .filter(p => p.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
  }

  getImageUrl(imageName?: string): string {
    if (!imageName || typeof imageName !== 'string' || !imageName.trim()) {
      // Return a placeholder image if imageName is missing
      return 'assets/images/no-image.png';
    }
    // Remove leading slashes if present
    const cleanName = imageName.replace(/^\/+/, '');
    return `${environment.apiBaseUrl}/api/CompanyFile/${cleanName}`;
  }

  isFeatured(product: Product): boolean {
    return product.isFeatured === true;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }
}
