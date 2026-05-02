import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApproveProductComponent } from '../approve/approve-product.component';
import { ProductFormComponent } from '../form/product-form.component';
import { PaginationComponent } from '../../Pagination/app-pagination.component';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../../../../services/management/management.service';
import type { ImportStatusResponse, Product as ProductBase } from '../../../../services/management/management.service';
import { Category, CategoryService, Users, StaticValueCatalog, StaticValueService, StaticValue } from '../../../../services/management/management.service';
import { AuthService } from '../../../../services/auth.service';
import { environment } from '../../../../../../environments/environment';
import { ProductListPopupComponent } from '../../../CustomComponents/ProductList/product-list-popup.component';
import { CategorySidebarComponent } from '../../categories/sidebar/category-sidebar.component';
import { HttpEvent, HttpEventType, HttpClient } from '@angular/common/http';
import { interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

import { UiService, StatusPopupState } from '../../../../../ui.service';
type Product = ProductBase & { selected?: boolean };

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ApproveProductComponent, ProductFormComponent, PaginationComponent, ProductListPopupComponent, CategorySidebarComponent],
  templateUrl:'./products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  showApproveModal = false;
  approveProductData: (Product & { categoryName?: string; brandName?: string }) | null = null;
  approveStatus: string = 'Pending';
  users: Users[] = [];
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
  staticValueCatalogs: StaticValueCatalog[] = [];
  staticValues: StaticValue[] = [];
  brandMap = new Map<number, string>();
  loadings: boolean = false;
  isPanelOpen: boolean = false;
  mobileSidebarOpen: boolean = false;

  progress = 0;
  rowsInserted = 0;
  uploadMessage = '';

  allSelected = false;
  canBulkApprove = false;
  showProductFormModal = false;
  editProductId: number | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  Math = Math;
  snackbar: { show: boolean; message: string; type: 'success' | 'error' | 'warning' } = { show: false, message: '', type: 'success' };
  tempOrderItems: any[] = [];
  selectedCategoryId: number | null = null;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  activeStatusFilter: 'all' | 'active' | 'inactive' = 'all';
  isMyProducts: boolean = false;
  
  stats = {
    myProductsCount: 0,
    waitingApprovalCount: 0,
    globalCatalogCount: 0,
    topBrands: [] as any[],
    topManufacturers: [] as any[]
  };
  selectedBrandId: number | null = null;
  selectedManufacturerId: number | null = null;

  constructor(
    private productService: ProductService,
    private router: Router,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private staticValueService: StaticValueService,
    public ui: UiService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.fetchStats();
    this.loadProducts();
    this.loadCategoryTree();
    this.loadBrandStaticValues();

    // Check for snackbar from navigation state
    const nav = this.router.getCurrentNavigation();
    const stateSnackbar = nav?.extras?.state?.['snackbar'] || 
                         (window.history.state?.['snackbar']); // Fallback for some Angular versions

    if (stateSnackbar) {
      this.showSnackbar(stateSnackbar.message, stateSnackbar.success ? 'success' : 'error');
    }
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'warning' = 'success', duration: number = 5000) {
    this.snackbar = { show: true, message, type };
    setTimeout(() => {
      this.snackbar.show = false;
      this.cdr.detectChanges();
    }, duration);
    this.cdr.detectChanges();
  }

  // ----------------------
  
  fetchStats() {
    let companyId: number | null = null;
    if (this.isMyProducts) {
      try {
        const claimsStr = localStorage.getItem('userClaims');
        if (claimsStr) {
          const claims = JSON.parse(claimsStr);
          companyId = claims.company_id ? Number(claims.company_id) : null;
        }
      } catch (e) {}
    }

    this.productService.getDashboardStats(this.isMyProducts, companyId).subscribe({
      next: (res: any) => {
        const data = res.result || res;
        this.stats = {
          globalCatalogCount: data.globalCatalogCount || 0,
          myProductsCount: data.myProductsCount || 0,
          waitingApprovalCount: data.waitingApprovalCount || 0,
          topBrands: data.topBrands || [],
          topManufacturers: data.topManufacturers || []
        };
        this.cdr.detectChanges(); // Force immediate UI update for name/count changes
      },
      error: () => console.log('Failed to load dashboard stats')
    });
  }

  // ----------------------
  // Modal Handlers
  // ----------------------
  openAddProductModal() {
    this.showProductFormModal = true;
    this.cdr.detectChanges();
  }

  closeProductFormModal() {
    this.showProductFormModal = false;
    this.editProductId = null;
    this.cdr.detectChanges();
  }

  onProductSaved() {
    const msg = this.editProductId
      ? 'Product updated successfully!'
      : 'Product added successfully!';
    this.showSnackbar(msg);
    this.loadProducts();
    this.fetchStats();
    this.showProductFormModal = false;
    this.editProductId = null;
    this.cdr.detectChanges();
  }
  // Load products & pagination
  // ----------------------
  loadProducts() {
    this.loading = true;
    this.error = undefined; // clear previously established error string

    let companyId: number | null = null;
    if (this.isMyProducts) {
      try {
        const claimsStr = localStorage.getItem('userClaims');
        if (claimsStr) {
          const claims = JSON.parse(claimsStr);
          companyId = claims.company_id ? Number(claims.company_id) : null;
        }
      } catch (e) {
        console.error('Error parsing userClaims:', e);
      }
    }

    let activeFlag: boolean | undefined = undefined;
    if (this.activeStatusFilter === 'active') activeFlag = true;
    else if (this.activeStatusFilter === 'inactive') activeFlag = false;

    this.productService.getProducts(this.currentPage, this.pageSize, this.selectedCategoryId, this.isMyProducts, companyId, this.selectedBrandId, this.selectedManufacturerId, this.searchTerm, activeFlag).subscribe({
      next: (pagedData: any) => {
        if (pagedData && pagedData.data) {
          this.products = pagedData.data.map((p: Product) => ({
            ...p,
            imageUrl: this.getImageUrl(p.imageName)
          }));
          this.filteredProducts = [...this.products];
          this.totalCount = pagedData.totalCount ?? 0;
          this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        } else {
          this.products = [];
          this.filteredProducts = [];
        }
        this.loading = false;
        this.fetchStats(); // Update stats as well
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error loading products:', err);
        this.error = 'Failed to load products. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  // Get brand name by brandId safely
getBrandName(brandId?: number | null): string {
  if (!brandId) return 'N/A';
  return this.brandMap.get(Number(brandId)) ?? 'N/A';
}

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.loadProducts();
  }

  onPageSizeChange(newSize: number) {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadProducts();
  }

  onSidebarCategorySelect(id: number | null) {
    this.selectedCategoryId = id;
    this.selectedBrandId = null; 
    this.selectedManufacturerId = null;
    this.currentPage = 1;
    this.loadProducts();
  }

  onSidebarBrandSelect(brandId: number) {
    this.selectedBrandId = brandId;
    this.selectedCategoryId = null; 
    this.selectedManufacturerId = null;
    this.currentPage = 1;
    this.loadProducts();
  }

  onSidebarManufacturerSelect(mId: number) {
    this.selectedManufacturerId = mId;
    this.selectedCategoryId = null;
    this.selectedBrandId = null;
    this.currentPage = 1;
    this.loadProducts();
  }

  toggleMyProducts(isMy: boolean) {
    this.isMyProducts = isMy;
    this.currentPage = 1;
    this.selectedCategoryId = null;
    this.loadProducts();
    this.fetchStats(); // Refresh dashboard counts for the new mode
  }

  // ----------------------
  // Category tree helpers
  // ----------------------
  loadCategoryTree() {
    this.categoryService.getTreeCategories().subscribe({
      next: (tree: Category[]) => {
        console.log('Category Tree Loaded:', tree);
        this.treeCategories = tree;
        this.cascadingDropdowns[0] = tree;
        this.dropdownLabels[0] = 'Parent Category';
        this.loadingStates[0] = false;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error loading category tree:', err);
        this.cdr.markForCheck();
      }
    });
  }

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
  // Toggle the right panel
  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
  }

// ----------------------
// CSV Upload
// ----------------------
onFileSelected(event: any) {
  const file: File = event.target.files[0];
  if (!file) return;

  this.uploadCSV(file);
}

uploadCSV(selectedFile: File) {

  if (!selectedFile) {
    this.showSnackbar('CSV upload failed.', 'error');
    return;
  }

  this.loading = true;

  this.productService.CSVImporter(selectedFile).subscribe({
    next: (response: any) => {

      this.loading = false;
      const statusUrl = response?.result?.jobId;

      if (!statusUrl) {
        this.showSnackbar('File uploaded successfully.', 'success');
        return;
      }

      this.showSnackbar('CSV uploaded. Processing started...', 'success');
      this.isPanelOpen = false;

      // Start checking job status
      this.checkImportStatus(statusUrl);
    },

    error: (err) => {
      console.error(err);
      this.loading = false;
      this.showSnackbar('CSV upload failed.', 'error');
      this.isPanelOpen = false;
    }
  });
}
// Load all brand static values once
loadBrandStaticValues(): void {
  this.staticValueService.getStaticValuesCatagory().subscribe({
    next: catalogs => {
      const brandCatalog = catalogs.find(c => c.catalogName === 'Brand');
      if (!brandCatalog) return;
      // Fetch brand values
      this.staticValueService.getStaticValues(brandCatalog.catalogId).subscribe({
        next: values => {
          this.brandMap.clear();

          // Ensure key is number and value is string
          values.forEach(v => {
            const id = Number(v.staticId); // Convert to number, safe for BIGINT
            this.brandMap.set(id, v.staticValueKey.toString()); // staticValueKey is the name
          });
        },
        error: err => console.error('Error loading brand values', err)
      });
    },
    error: err => console.error('Error loading static value catalog', err)
  });
}

  // ----------------------
  // Approve / remove product
  // ----------------------
approveProduct(product: Product) {
  // Prepare data for the modal
  this.approveProductData = {
    ...product,
    categoryName: this.getCategoryName(product.categoryId),
    brandName: this.getBrandName(product.brandId),
  };
  this.approveStatus = product.status || 'Pending';
  this.showApproveModal = true;
}

removeProduct(product: Product) {
  // Open modal for removal like approve
  this.approveProduct(product);
}

onApproveSave(event: { status: string; reason?: string; email?: string }) {
  if (!this.approveProductData) return;

  const email = event.email || '';

  // Prepare payload for approval or removal
  const payload = {
    id: this.approveProductData.id,
    action: event.status,
    remarks: event.reason || '',
    email: email
  };

  this.productService.ApprovedProductById(this.approveProductData.id, payload).subscribe({
    next: (updatedProduct: Product) => {
      // Update the local list of products with the new status
      const idx = this.products.findIndex((p) => p.id === updatedProduct.id);
      if (idx > -1) {
        this.products[idx].status = updatedProduct.status; // Update the status of the product
      }

      // Ensure filtered products are updated as well
      this.filteredProducts = [...this.products]; // Update filtered products

      // Optionally, you can fetch the product list from the server again to ensure data is in sync
      this.refreshProductList();  // Re-fetch to ensure data is updated
      this.fetchStats();          // Re-fetch global stats to ensure consistency

      // Close the modal after the operation is done
      this.showApproveModal = false;

      const msg = event.status === 'Approved' ? 'Product approved successfully!' : 'Product rejected.';
      const type = event.status === 'Approved' ? 'success' : 'warning';
      this.showSnackbar(msg, type);
    },
    error: (err) => {
      console.error('Error updating product status:', err);
      this.showSnackbar('Operation failed', 'error');
    },
  });
}

// Method to refresh the product list (fetching from the server)
refreshProductList() {
  this.loadProducts();
}

onApproveCancel() {
  this.showApproveModal = false;
}

downloadTemplate() {
  const fileUrl = 'assets/templates/product-template.csv';

  fetch(fileUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('File not found');
      }

      return response.blob();
    })
    .then(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'product-template.csv';
      link.click();
      this.togglePanel();
    })
    .catch(err => console.error('Download error:', err));
    
}

  // ----------------------
  // Bulk selection
  // ----------------------
  updateBulkButtonState() {
    this.canBulkApprove = this.filteredProducts.some(p => p.selected);
    this.allSelected = this.filteredProducts.every(p => p.selected);
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    this.filteredProducts.forEach(p => (p.selected = checked));
    this.updateBulkButtonState();
  }

  bulkApprove() {
    const selectedProducts = this.filteredProducts.filter(p => p.selected);
    if (!selectedProducts.length) return;

    // Experienced developer: Use AuthService to get synced claims from token
    const claims = this.authService.getTokenClaims();
    
    // Support both standard 'email' and .NET identity 'emailaddress' claim keys
    // In .NET JWT, email is often 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
    const email = claims?.email || 
                  claims?.['email'] ||
                  claims?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
                  '';

    const requests = selectedProducts.map(p => {
      // Use PascalCase to match .NET DTO properties exactly for better compatibility
      const payload = { 
        Action: 'Approved', 
        Remarks: 'Bulk approved', 
        Email: email 
      };
      return this.productService.bulkApproveProduct(p.id, payload);
    });

    this.loading = true;
    forkJoin(requests).subscribe({
      next: () => {
        selectedProducts.forEach(p => {
          p.status = 'Approved';
          p.selected = false;
        });
        this.canBulkApprove = false;
        this.allSelected = false;
        this.loading = false;
        this.fetchStats();
        this.showSnackbar(`${selectedProducts.length} products approved successfully!`, 'success');
      },
      error: err => {
        console.error('Bulk approve failed', err);
        this.loading = false;
        this.showSnackbar('Bulk approve failed', 'error');
      }
    });
  }

  // ----------------------
  // Helpers
  // ----------------------
getImageUrl(imageName?: string): string {
  return imageName 
    ? `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(imageName)}`
    : 'assets/images/no-image.png';
}

  isFeatured(product: Product): boolean {
    return product.isFeatured === true;
  }

  onSearch() {
    this.currentPage = 1;
    this.loadProducts();
  }

  resetFilters() {
    this.searchTerm = '';
    this.activeStatusFilter = 'all';
    this.currentPage = 1;
    this.loadProducts();
  }

  editProduct(product: Product) {
    if (product?.id) this.router.navigate(['/management/products/edit', product.id]);
  }

  viewProduct(product: Product) {
    if (product?.id) this.router.navigate(['/products', product.id]);
  }
  getDefaultImage(product: Product) {
  return product.images?.find(i => i.isDefault) 
      || product.images?.[0];
}

  goToEditProduct(id: number) {
    this.editProductId = id;
    this.showProductFormModal = true;
    this.cdr.detectChanges();
  }

  deleteProduct(product: Product) {
    if (!product.id) return;
    
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.showSnackbar('Product deleted successfully', 'success');
          this.loadProducts();
          this.fetchStats();
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.showSnackbar('Error deleting product. It might be linked to orders.', 'error');
        }
      });
    }
  }
  openProductListPopup(product: Product) {
  this.ui.openProductList(
   2,
    product.name || '',
    'list' // or 'table' or 'scroll'
  );
}
  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredProducts.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (column) {
        case 'name':
          valA = a.name?.toLowerCase() || '';
          valB = b.name?.toLowerCase() || '';
          break;
        case 'category':
          valA = this.getCategoryName(a.categoryId).toLowerCase();
          valB = this.getCategoryName(b.categoryId).toLowerCase();
          break;
        case 'brand':
          valA = this.getBrandName(a.brandId).toLowerCase();
          valB = this.getBrandName(b.brandId).toLowerCase();
          break;
        case 'rate':
          valA = a.rate || 0;
          valB = b.rate || 0;
          break;
        case 'addedBy':
          valA = (a.createdBy || '').toLowerCase();
          valB = (b.createdBy || '').toLowerCase();
          break;
        case 'status':
          valA = (a.status || 'Pending').toLowerCase();
          valB = (b.status || 'Pending').toLowerCase();
          break;
        default:
          return 0;
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.cdr.detectChanges();
  }
  checkImportStatus(jobId: string) {
    const pollInterval = 3000;
    const timer$ = interval(pollInterval);

    const subscription = timer$
      .pipe(
        switchMap(() => this.productService.importStatus(jobId)),
        takeWhile(
          (res: ImportStatusResponse) =>
            res.result?.status !== 'Completed' && res.result?.status !== 'Failed',
          true
        )
      )
      .subscribe({
        next: (res: ImportStatusResponse) => {
          if (res?.result?.status === 'Completed') {
            const errors: string[] = res.result.errors || [];
            const duplicates = errors.filter(e => e.toLowerCase().includes('already exists'));
            const realErrors = errors.filter(e => !e.toLowerCase().includes('already exists'));
            
            const processedCount = res.result.processed || 0;
            const totalCount = res.result.total || 0;

            let message = `${processedCount} product(s) inserted successfully.`;
            
            if (duplicates.length > 0) {
              message += ` ${duplicates.length} skipped (duplicates found).`;
              // Try to extract a clean message from the first duplicate error
              const firstDup = duplicates[0].includes(':') 
                ? duplicates[0].split(':').slice(1).join(':').trim() 
                : duplicates[0];
              message += ` Example: ${firstDup}`;
            }

            if (realErrors.length > 0) {
              message += ` ${realErrors.length} other errors occurred.`;
            }

            // Show for longer (10s) since it contains detail
            this.showSnackbar(message, realErrors.length === 0 ? 'success' : 'error', 10000);
            
            this.loadProducts();
            subscription.unsubscribe();
          } else if (res?.result?.status === 'Failed') {
            this.showSnackbar('CSV import failed. Please check the file format.', 'error');
            subscription.unsubscribe();
          }
        },
        error: (err: any) => {
          console.error('Status check error:', err);
          this.showSnackbar('Error checking import status', 'error');
          subscription.unsubscribe();
        }
      });
  }
}
