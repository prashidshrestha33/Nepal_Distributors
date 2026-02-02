import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApproveProductComponent } from '../approve/approve-product.component';
import { PaginationComponent } from '../../Pagination/app-pagination.component';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../../../../services/management/management.service';
import type { Product as ProductBase } from '../../../../services/management/management.service';

type Product = ProductBase & { selected?: boolean };
import { Category } from '../../../../services/management/management.service';
import { CategoryService } from '../../../../services/management/management.service';
import { Users } from '../../../../services/management/management.service';
import { environment } from '../../../../../../environments/environment';


@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ApproveProductComponent, PaginationComponent],
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
  selectedFile!: File;
  jobId?: string;
  error?: string;
  
// Bulk selection flag
allSelected = false;
canBulkApprove = false;
  
  
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
  if (product && product.id) this.router.navigate(['/management/products/edit', product.id]);
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
    // Step 1: bind selected file
onFileSelected(event: any) {
  this.selectedFile = event.target.files[0];
  if (this.selectedFile) {
    this.importCsv(); // automatically trigger upload
  }
}

    // Step 2: call API
  importCsv() {
    debugger;
    if (!this.selectedFile) return;

    this.loading = true;
    this.error = undefined;

    this.productService.CSVImporter(this.selectedFile).subscribe({
      next: res => {
        this.jobId = res.jobId; // API returns jobId
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.error || 'CSV import failed';
        this.loading = false;
      }
    });
  }

updateBulkButtonState() {
  this.canBulkApprove = this.filteredProducts.some(p => p.selected);
  this.allSelected = this.filteredProducts.every(p => p.selected);
}

toggleSelectAll(event: any) {
  const checked = event.target.checked;
  this.filteredProducts.forEach(p => (p.selected = checked));
  this.updateBulkButtonState();
}

// Bulk approve function
bulkApprove() {
  const selectedProducts = this.filteredProducts.filter(p => p.selected);
  if (selectedProducts.length === 0) return;

  const requests = selectedProducts.map(p => {
    const payload = { action: 'Approved', remarks: 'Bulk approved' };
    return this.productService.bulkApproveProduct(p.id, payload);
  });

  this.loading = true;

  // Execute all API calls
  forkJoin(requests).subscribe({
    next: res => {
      // Update local product statuses
      selectedProducts.forEach(p => {
        p.status = 'Approved';
        p.selected = false; // uncheck after approve
      });
      this.canBulkApprove = false;
      this.allSelected = false;
      this.loading = false;
    },
    error: err => {
      console.error('Bulk approve failed', err);
      this.loading = false;
    }
  });
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
  // ...existing code...
  goToEditProduct(id: number) {
    this.router.navigate(['/management/products/edit', id]);
  }

onApproveSave(event: { status: string; reason?: string }) {
  if (!this.approveProductData) return;
  const payload = {
    id: this.approveProductData.id,
    action: event.status,
    remarks: event.reason || ''
  };
  this.productService.ApprovedProductById(this.approveProductData.id, payload).subscribe({
    next: (updatedProduct: Product) => {
      // Update local table
      const idx = this.products.findIndex(p => p.id === updatedProduct.id);
      if (idx > -1) {
        this.products[idx].status = updatedProduct.status;
      }
      this.filteredProducts = [...this.products];
      this.showApproveModal = false;
    },
    error: (err: unknown) => {
      console.error('Error updating product status:', err);
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
      // Map products and add imageUrl
      this.products = response.result.map((p: Product) => ({
        ...p,
        imageUrl: this.getImageUrl(p.imageName) // map imageUrl from imageName
      }));

      this.filteredProducts = [...this.products];

      // Set pagination
      this.totalCount = this.products.length;
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
  //Pagination
  onPageChange(newPage: number) {
  this.currentPage = newPage;
  this.loadProducts();
}

onPageSizeChange(newSize: number) {
  this.pageSize = newSize;
  this.currentPage = 1;
  this.loadProducts();
}
}
