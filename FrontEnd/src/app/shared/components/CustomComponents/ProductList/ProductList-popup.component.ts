import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiService } from '../../../../ui.service';
import {  Product, ProductService } from '../../../services/management/management.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-ProductList-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ProductList-popup.component.html',
  styleUrls: ['./ProductList-popup.component.css']
})
export class ProductListPopupComponent implements OnInit {

  @Input() companyId!: number;
  @Input() ProductListStyle!: string;
  @Input() KeyWord!: string;
  @Output() close = new EventEmitter<void>();

  products: Product[] = [];
  editMode = false;
  loading = true;
  uploading = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;

  constructor(
    private ProductService: ProductService,
    private ui: UiService
  ) {}

  ngOnInit(): void {
    if (this.companyId) {
      this.loadProduct();
    }
  }

  // ✅ Load User
   loadProduct(): void {
    this.ProductService.SearchProducts(this.KeyWord).subscribe({
        next: (response: any) => {
        this.products = response.result.map((p: Product) => ({
          ...p,
          imageUrl: this.getImageUrl(p.imageName)
        }));
        this.products = [...this.products];
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
 save() {
}
  getImageUrl(imageName?: string): string {
    if (!imageName?.trim()) return 'assets/images/no-image.png';
    return `${environment.apiBaseUrl}/api/CompanyFile/${imageName.replace(/^\/+/, '')}`;
  }


  cancelEdit(): void {
    this.editMode = false;
    this.loadProduct();
  }

  closePopup(): void {
    this.close.emit();
  }
}
