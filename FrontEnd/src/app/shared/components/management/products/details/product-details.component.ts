import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApproveProductComponent } from '../approve/approve-product.component';
import {
  ProductService,
  StaticValueService,
  CategoryService,
  Category,
  Product,
  StaticValue,
  StaticValueCatalog
} from '../../../../services/management/management.service';
import { environment } from '../../../../../../environments/environment';

// Define ProductImage interface
interface ProductImage {
  id: number;
  productId: number;
  imageName: string;
  isDefault: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ApproveProductComponent],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {
  product?: Product;
  loading = true;

  categories: Category[] = [];
  brandMap = new Map<number, string>();
  manufactureMap = new Map<number, string>();

  selectedRating: number = 0;
  commentText: string = '';
  approveProductData: (Product & { categoryName?: string; brandName?: string }) | null = null;

  // Approve modal properties
  showApproveModal: boolean = false;
  approveStatus: string = '';

  // Carousel
  currentIndex: number = 0;
  carouselInterval: any; // To clear interval on destroy
  images?: ProductImage[];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private staticValueService: StaticValueService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);
    if (!id) {
      console.error('Invalid product ID from route:', idParam);
      this.loading = false;
      return;
    }

    this.loadProduct(id);
    this.loadCategories();
    this.loadStaticValues();
    setInterval(() => {
    if (this.product?.images?.length) {
      this.selectedImageIndex = (this.selectedImageIndex + 1) % this.product.images.length;
    }
  }, 5000); // change image every 3 seconds
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  // ----------------------
  // Feedback Section
  // ----------------------
  setRating(rating: number) {
    this.selectedRating = rating;
  }

  submitFeedback() {
    if (!this.commentText.trim() || this.selectedRating === 0) {
      alert('Please select a rating and enter a comment.');
      return;
    }

    const feedback = {
      productId: this.product?.id,
      rating: this.selectedRating,
      comment: this.commentText.trim(),
      createdAt: new Date()
    };

    // TODO: Save feedback to backend
    alert('Thank you for your feedback!');
    this.selectedRating = 0;
    this.commentText = '';
  }

  // ----------------------
  // Product Load
  // ----------------------
  // private loadProduct(id: number) {
  //   this.loading = true;
  //   this.productService.getProductById(id).subscribe({
  //     next: (res: any) => {
  //       debugger;
  //       const data = res.result ?? res;
  //       if (data) {
  //         // Assign product and ensure images array exists
  //         this.product = {
  //           ...data,
  //           images: data.images ?? []  // ← make sure images array is not undefined
  //         };

  //         // Start carousel only if images exist
  //         if (this.product?.images && this.product.images.length > 0) {
  //           // Find initial default image index
  //           const defaultIndex = this.product.images.findIndex(img => img.isDefault);
  //           this.currentIndex = defaultIndex !== -1 ? defaultIndex : 0;
  //         }
  //       }

  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error loading product:', err);
  //       this.loading = false;
  //     }
  //   });
  // }

  loadProduct(id: number) {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (response: any) => {
        // this.product = response.result.map((p: Product) => ({
        //   ...p,
        //   imageUrl: this.getImageUrl(p.imageName)
        // }));
        const data = response.result ?? response;
        if (data) {
          // Assign product and ensure images array exists
          this.product = {
            ...data,
            images: data.images ?? []  // ← make sure images array is not undefined
          };

          // Start carousel only if images exist
          if (this.product?.images && this.product.images.length > 0) {
            // Find initial default image index
            const defaultIndex = this.product.images.findIndex(img => img.isDefault);
            this.currentIndex = defaultIndex !== -1 ? defaultIndex : 0;
          }
        }
        this.loading = false;
      },
      
      error: err => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

    getDefaultImage(product: Product) {
      debugger;
  return product.images?.find(i => i.isDefault) 
      || product.images?.[0];
}
  // Manual index change (if you add thumbnails/buttons in HTML)
  setCurrentIndex(index: number) {
    this.currentIndex = index;
  }

  private loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) => console.error('Error loading categories', err)
    });
  }

  private loadStaticValues() {
    this.staticValueService.getStaticValuesCatagory().subscribe({
      next: (catalogs: StaticValueCatalog[]) => {
        if (!catalogs) return;

        const brandCat = catalogs.find(c => c.catalogName === 'Brand');
        if (brandCat) {
          this.staticValueService.getStaticValues(brandCat.catalogId)
            .subscribe({
              next: (vals: StaticValue[]) => vals.forEach(v => this.brandMap.set(Number(v.staticId), v.staticValueKey))
            });
        }

        const manuCat = catalogs.find(c => c.catalogName === 'Manufacture');
        if (manuCat) {
          this.staticValueService.getStaticValues(manuCat.catalogId)
            .subscribe({
              next: (vals: StaticValue[]) => vals.forEach(v => this.manufactureMap.set(Number(v.staticId), v.staticValueKey))
            });
        }
      },
      error: (err) => console.error('Error loading static value catalog', err)
    });
  }

  // ----------------------
  // Getters
  // ----------------------
  getBrandName(brandId?: number | null): string {
    return !brandId ? 'N/A' : this.brandMap.get(Number(brandId)) ?? 'N/A';
  }

  getManufactureName(manufacturerId?: number | null): string {
    return !manufacturerId ? 'N/A' : this.manufactureMap.get(Number(manufacturerId)) ?? 'N/A';
  }

  getCategoryName(categoryId?: number): string {
    if (typeof categoryId !== 'number') return 'N/A';
    const cat = this.categories.find(c => c.id === categoryId);
    return cat?.name ?? 'N/A';
  }

  getImageUrl(imageName?: string): string {

    return imageName
      ? `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(imageName)}`
      : 'assets/images/no-image.png';

  }

  goBack() {
    this.router.navigate(['/products']);
  }

  // ----------------------
  // Approve Product
  // ----------------------
  approveProduct(product: Product) {
    this.approveProductData = {
      ...product,
      categoryName: this.getCategoryName(product.categoryId),
      brandName: this.getBrandName(product.brandId),
    };
    this.approveStatus = product.status || 'Pending';
    this.showApproveModal = true;
  }

  onApproveCancel() {
    this.showApproveModal = false;
  }

  onApproveSave(event: { status: string; reason?: string }) {
    if (!this.approveProductData) return;

    // Prepare payload for approval or removal
    const payload = {
      id: this.approveProductData.id,
      action: event.status,
      remarks: event.reason || '',
    };

    this.productService.ApprovedProductById(this.approveProductData.id, payload).subscribe({
      next: (updatedProduct: Product) => {
        if (this.product && this.product.id === updatedProduct.id) {
          this.product.status = updatedProduct.status;
        }
        this.showApproveModal = false;
      },
      error: (err) => {
        console.error('Error updating product status:', err);
      },
    });
  }
selectedImageIndex = 0;

prevImage() {
  if (!this.product?.images?.length) return;
  this.selectedImageIndex =
    (this.selectedImageIndex - 1 + this.product.images.length) % this.product.images.length;
}

nextImage() {
  if (!this.product?.images?.length) return;
  this.selectedImageIndex = (this.selectedImageIndex + 1) % this.product.images.length;
}

selectImage(index: number) {
  if (!this.product?.images?.length) return;
  this.selectedImageIndex = index;
}
  // Handle image load error
  handleImageError(event: any) {
    event.target.src = 'assets/images/no-image.png';
  }
  get currentImageUrl(): string | null {
  if (this.product?.images?.length && this.product.images[this.selectedImageIndex]) {
    return this.getImageUrl(this.product.images[this.selectedImageIndex].imageName);
  }
  return null;
}
}