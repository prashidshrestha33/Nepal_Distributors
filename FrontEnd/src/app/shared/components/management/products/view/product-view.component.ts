import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ProductService, Product, Category } from '../../../../services/management/management.service';
import { CategoryService } from '../../../../services/management/management.service';

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-view.component.html',
  styleUrls: ['./product-view.component.css'],
  providers: [DecimalPipe]
})
export class ProductViewComponent implements OnInit {
  product: Product | null = null;
  categories: Category[] = [];
  breadcrumb: string[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.productService.getProductById(id).subscribe(product => {
        this.product = product;
        this.loading = false;
        this.loadCategoriesAndBreadcrumb();
      });
    }
  }

  loadCategoriesAndBreadcrumb() {
    this.categoryService.getTreeCategories().subscribe((tree: Category[]) => {
      this.categories = tree;
      if (this.product) {
        this.breadcrumb = getCategoryPath(this.categories, this.product.categoryId);
      }
    });
  }
}

// Helper to resolve category path as array of names
export function getCategoryPath(tree: Category[], categoryId: number): string[] {
  const path: string[] = [];
  function find(catList: Category[], id: number): boolean {
    for (const cat of catList) {
      if (cat.id === id) {
        path.unshift(cat.name);
        return true;
      }
      if (cat.children && find(cat.children, id)) {
        path.unshift(cat.name);
        return true;
      }
    }
    return false;
  }
  find(tree, categoryId);
  return path;
}

