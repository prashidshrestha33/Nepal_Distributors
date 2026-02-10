import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService, CategoryService, Category, Product, StaticValue, StaticValueService } from '../../../../services/management/management.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {
  product?: Product;
  loading = true;
  categories: Category[] = [];
  brandMap = new Map<number, string>(); // brandId -> brandName mapping

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

    // Load categories
    this.categoryService.getCategories().subscribe((cats) => {
      this.categories = cats;
    });

    // Load brand static values
    this.loadBrandStaticValues();
  }

  // Load all brand static values once
  loadBrandStaticValues(): void {
    this.staticValueService.getStaticValuesCatagory().subscribe({
      next: (catalogs) => {
        const brandCatalog = catalogs.find(c => c.catalogName === 'Brand');
        if (!brandCatalog) return;

        // Fetch brand values
        this.staticValueService.getStaticValues(brandCatalog.catalogId).subscribe({
          next: (values: StaticValue[]) => {
            this.brandMap.clear();

            values.forEach(v => {
              const id = Number(v.staticId); // Convert to number for BIGINT compatibility
              this.brandMap.set(id, v.staticValueKey.toString());
            });

            console.log('Brand map loaded:', this.brandMap);
          },
          error: (err) => console.error('Error loading brand values', err)
        });
      },
      error: (err) => console.error('Error loading static value catalog', err)
    });
  }

  // Get brand name safely by brandId
  getBrandName(brandId?: number | null): string {
    if (!brandId) return 'N/A';
    return this.brandMap.get(Number(brandId)) ?? 'N/A';
  }

  // Get category name safely
  getCategoryName(categoryId?: number): string {
    if (typeof categoryId !== 'number') return 'N/A';
    const cat = this.categories.find(c => c.id === categoryId);
    return cat && cat.name ? cat.name : categoryId.toString();
  }

  // Load product details
  loadProduct(id: number) {
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

  getImageUrl(imageName?: string): string {
    if (!imageName) return 'assets/images/no-image.png';
    return `${environment.apiBaseUrl}/api/CompanyFile/${imageName}`;
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}
