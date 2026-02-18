import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {
  product?: Product;
  loading = true;

  categories: Category[] = [];

  brandMap = new Map<number, string>();
  manufactureMap = new Map<number, string>();

  // ————————— Feedback / Rating —————————
  selectedRating: number = 0;
  commentText: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private staticValueService: StaticValueService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProduct(id);
    this.loadCategories();
    this.loadStaticValues();
  }

  // ————— Ratings & Feedback —————
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

    // TODO: Save to backend
    alert('Thank you for your feedback!');

    this.selectedRating = 0;
    this.commentText = '';
  }

  // ————— Loading Product & Lookups —————

  private loadProduct(id: number) {
    this.productService.getProductById(id).subscribe({
      next: (res: any) => {
        this.product = res.result;
        if (this.product) {
          this.product.imageUrl = this.product.imageName
            ? this.getImageUrl(this.product.imageName)
            : 'assets/images/no-image.png';
        }
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
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

        // Brand
        const brandCat = catalogs.find(c => c.catalogName === 'Brand');
        if (brandCat) {
          this.staticValueService.getStaticValues(brandCat.catalogId)
            .subscribe({ next: (vals: StaticValue[]) => vals.forEach(v => this.brandMap.set(Number(v.staticId), v.staticValueKey)) });
        }

        // Manufacture
        const manuCat = catalogs.find(c => c.catalogName === 'Manufacture');
        if (manuCat) {
          this.staticValueService.getStaticValues(manuCat.catalogId)
            .subscribe({ next: (vals: StaticValue[]) => vals.forEach(v => this.manufactureMap.set(Number(v.staticId), v.staticValueKey)) });
        }
      },
      error: (err) => console.error('Error loading static value catalog', err)
    });
  }

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
    if (!imageName) return 'assets/images/no-image.png';
    return `${environment.apiBaseUrl}/api/CompanyFile/${imageName}`;
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}
