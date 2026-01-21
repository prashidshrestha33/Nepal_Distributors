import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../../../../services/management/management.service';
import type { Product, ProductResponse } from '../../../../services/management/management.service';
import { Category } from '../../../../services/management/management.service';
import { CategoryService } from '../../../../services/management/management.service';
import { UserService} from '../../../../services/management/user.service';
import { Users } from '../../../../services/management/management.service';


@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
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

  // Edit product
  editProduct(product: Product) {
    if (product && product.id) {
      this.router.navigate(['/products/edit', product.id]);
    }
  }

  // Approve product (stub)
  approveProduct(product: Product) {
    // Implement approval logic here
    alert('Approve product: ' + product.name);
  }

  // Delete product (wrapper for existing delete)
  deleteProduct(product: Product) {
    if (product && product.id) {
      this.delete(product.id);
    }
  }

  /**
   * Load products with pagination
   */
  loadProducts() {
  this.loading = true;

  this.productService.getProducts(this.currentPage, this.pageSize).subscribe({
    next: (response: any) => {
      // Use 'result' instead of 'data'
      this.products = response.result;
      this.filteredProducts = response.result;

      // Set totalCount and totalPages
      this.totalCount = response.result.length; // If API provides totalCount, use that instead
      this.totalPages = Math.ceil(this.totalCount / this.pageSize);

      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading products:', err);
      this.loading = false;
    }
  });
}

loadUser() {
  this.loading = true;

  this.productService.getProducts(this.currentPage, this.pageSize).subscribe({
    next: (response: any) => {
      this.products = response.result;
      this.filteredProducts = response.result;

      this.totalCount = response.result.length; 
      this.totalPages = Math.ceil(this.totalCount / this.pageSize);

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
    if (!id || id === 0) return 'N/A';
    return id.toString();
  }

  /**
   * Search products by name or SKU
   */
  onSearch() {
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  /**
   * Get placeholder image if product image is missing
   */
  getImageUrl(product: Product): string {
    return product.imageUrl || '/images/placeholder-product.png';
  }

  /**
   * Check if product is featured
   */
  isFeatured(product: Product): boolean {
    return product.isFeatured === true;
  }

  /**
   * Delete product
   */
  delete(id: number | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => console.error('Error deleting product:', err)
      });
    }
  }

  /**
   * Pagination: Go to previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  /**
   * Pagination: Go to next page
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  /**
   * Pagination: Go to specific page
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  /**
   * Get array of page numbers for pagination display
   */
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

  /**
   * Check if there are more pages
   */
  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  /**
   * Check if there are previous pages
   */
  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }
}
