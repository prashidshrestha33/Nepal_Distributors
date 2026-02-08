import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApproveProductComponent } from '../approve/approve-product.component';
import { PaginationComponent } from '../../Pagination/app-pagination.component';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../../../../services/management/management.service';
import type { Product as ProductBase } from '../../../../services/management/management.service';
import { Category, CategoryService, Users, StaticValueCatalog, StaticValueService, StaticValue } from '../../../../services/management/management.service';
import { environment } from '../../../../../../environments/environment';

type Product = ProductBase & { selected?: boolean };

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ApproveProductComponent, PaginationComponent],
  templateUrl: './products.component.html',
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

  // Bulk selection flags
  allSelected = false;
  canBulkApprove = false;

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;

  Math = Math;

  constructor(
    private productService: ProductService,
    private router: Router,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private staticValueService: StaticValueService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategoryTree();
    this.loadBrandStaticValues();
  }

  // ----------------------
  // Load products & pagination
  // ----------------------
  loadProducts() {
    this.loading = true;
    this.productService.getProducts(this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        this.products = response.result.map((p: Product) => ({
          ...p,
          imageUrl: this.getImageUrl(p.imageName)
        }));
        this.filteredProducts = [...this.products];
        this.totalCount = this.products.length;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        this.loading = false;
      },
      error: err => {
        console.error('Error loading products:', err);
        this.loading = false;
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

  // ----------------------
  // Category tree helpers
  // ----------------------
  loadCategoryTree() {
    this.categoryService.getTreeCategories().subscribe({
      next: (tree: Category[]) => {
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

  // ----------------------
  // Brand static values
  // ----------------------
// Load all brand static values once
loadBrandStaticValues(): void {
  this.staticValueService.getStaticValuesCatagory().subscribe({
    next: catalogs => {
      const brandCatalog = catalogs.find(c => c.catalogName === 'Brand');
      if (!brandCatalog) return;
debugger;
      // Fetch brand values
      this.staticValueService.getStaticValues(brandCatalog.catalogId).subscribe({
        next: values => {
          this.brandMap.clear();

          // Ensure key is number and value is string
          values.forEach(v => {
            debugger;
            const id = Number(v.staticId); // Convert to number, safe for BIGINT
            this.brandMap.set(id, v.staticValueKey.toString()); // staticValueKey is the name
          });

          console.log('Brand map loaded:', this.brandMap);
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
    this.approveProductData = {
      ...product,
      categoryName: this.getCategoryName(product.categoryId),
      brandName: this.getBrandName(product.brandId)
    };
    this.approveStatus = product.status || 'Pending';
    this.showApproveModal = true;
  }

  removeProduct(product: Product) {
    // Just open modal like approve
    this.approveProduct(product);
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
        const idx = this.products.findIndex(p => p.id === updatedProduct.id);
        if (idx > -1) this.products[idx].status = updatedProduct.status;
        this.filteredProducts = [...this.products];
        this.showApproveModal = false;
      },
      error: err => console.error('Error updating product status:', err)
    });
  }

  onApproveCancel() {
    this.showApproveModal = false;
  }

  // ----------------------
  // File upload
  // ----------------------
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) this.importCsv();
  }

  importCsv() {
    if (!this.selectedFile) return;
    this.loading = true;
    this.error = undefined;
    this.productService.CSVImporter(this.selectedFile).subscribe({
      next: res => {
        this.jobId = res.jobId;
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.error || 'CSV import failed';
        this.loading = false;
      }
    });
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

    const requests = selectedProducts.map(p => {
      const payload = { action: 'Approved', remarks: 'Bulk approved' };
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
      },
      error: err => {
        console.error('Bulk approve failed', err);
        this.loading = false;
      }
    });
  }

  // ----------------------
  // Helpers
  // ----------------------
  getImageUrl(imageName?: string): string {
    if (!imageName?.trim()) return 'assets/images/no-image.png';
    return `${environment.apiBaseUrl}/api/CompanyFile/${imageName.replace(/^\/+/, '')}`;
  }

  isFeatured(product: Product): boolean {
    return product.isFeatured === true;
  }

  onSearch() {
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  editProduct(product: Product) {
    if (product?.id) this.router.navigate(['/management/products/edit', product.id]);
  }

  viewProduct(product: Product) {
    if (product?.id) this.router.navigate(['/products', product.id]);
  }

  goToEditProduct(id: number) {
    this.router.navigate(['/management/products/edit', id]);
  }
}
