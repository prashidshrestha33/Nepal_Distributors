import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService, CategoryService, Category, Brand } from '../../../../services/management/management.service';
import { environment } from '../../../../../../environments/environment';
import type { Product } from '../../../../services/management/management.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {
  product?: Product;
  selectedImage?: string;
  loading = true;
  categories: Category[] = [];
  brands: Brand[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProduct(id);
    this.categoryService.getCategories().subscribe((cats) => {
      this.categories = cats;
    });
    // Simulate Brand fetch (replace with real service if available)
    this.brands = [
      { id: 7, name: 'Apple' },
      { id: 1, name: 'Samsung' },
      { id: 2, name: 'Sony' },
      // ...add more as needed
    ];
  }
  getCategoryName(categoryId?: number): string {
    if (typeof categoryId !== 'number') return 'N/A';
    const cat = this.categories.find(c => c.id === categoryId);
    return cat && cat.name ? cat.name : categoryId.toString();
  }

  getBrandName(brandId?: number): string {
    if (typeof brandId !== 'number') return 'N/A';
    const brand = this.brands.find(b => b.id === brandId);
    return brand && brand.name ? brand.name : brandId.toString();
  }

  loadProduct(id: number) {
  this.productService.getProductById(id).subscribe({
    next: (res: any) => {
      this.product = res.result; // 👈 FIX HERE

      this.selectedImage = this.product?.imageName
        ? this.getImageUrl(this.product.imageName)
        : 'assets/images/no-image.png';

      this.loading = false;
    },
    error: () => (this.loading = false)
  });
}


  getImageUrl(imageName?: string): string {
    if (!imageName) return 'assets/images/no-image.png';
    return `${environment.apiBaseUrl}/api/CompanyFile/${imageName}`;
  }

  // selectImage removed: not needed for single image

  goBack() {
    this.router.navigate(['/products']);
  }
}
