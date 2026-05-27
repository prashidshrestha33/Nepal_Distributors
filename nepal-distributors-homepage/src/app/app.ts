import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomepageService, HomepageResponse, HeroBanner } from './services/homepage.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private homepageService = inject(HomepageService);
  
  // State management using modern Angular signals
  homepageData = signal<HomepageResponse | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  activeBannerIndex = signal<number>(0);
  
  private carouselInterval: any;
  
  // Static stats for a premium B2B directory look
  stats = [
    { value: '5,000+', label: 'Wholesale Products' },
    { value: '500+', label: 'Verified Suppliers' },
    { value: '77', label: 'Districts Covered' },
    { value: 'NPR 0', label: 'Commission Fees' }
  ];

  ngOnInit() {
    this.fetchData();
    this.startCarouselRotation();
  }

  ngOnDestroy() {
    this.stopCarouselRotation();
  }

  fetchData() {
    this.loading.set(true);
    this.error.set(null);
    
    this.homepageService.getHomepageData()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.homepageData.set(data);
        },
        error: (err) => {
          console.error('Failed to load homepage data:', err);
          this.error.set('We were unable to load the storefront data. Please ensure the backend is running locally.');
        }
      });
  }

  // Slider carousel mechanics
  startCarouselRotation() {
    this.carouselInterval = setInterval(() => {
      const data = this.homepageData();
      if (data && data.heroBanners && data.heroBanners.length > 0) {
        const nextIndex = (this.activeBannerIndex() + 1) % data.heroBanners.length;
        this.activeBannerIndex.set(nextIndex);
      }
    }, 6000); // Rotate every 6 seconds
  }

  stopCarouselRotation() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  selectBanner(index: number) {
    this.activeBannerIndex.set(index);
    // Restart timer on manual interaction to give user reading time
    this.stopCarouselRotation();
    this.startCarouselRotation();
  }

  // Navigation actions (can link to admin portal or alert)
  goToAdminPortal() {
    // Links to admin panel (running on manage.nepaldistributors.com or localhost:4200)
    const adminUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:4200'
      : 'https://manage.nepaldistributors.com';
    window.open(adminUrl, '_blank');
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Utility to handle default missing images beautifully
  getProductImage(product: any): string {
    const defaultImage = product.defaultImage || product.DefaultImage;
    if (defaultImage) {
      // If it starts with http, return as is. Otherwise prefix upload path
      if (defaultImage.startsWith('http')) {
        return defaultImage;
      }
      return `http://localhost:49857/UploadedImages/${defaultImage}`;
    }
    // Return empty string to let CSS/HTML render placeholder card
    return '';
  }

  // Failed image tracking sets
  failedProductImageIds = new Set<number>();
  failedCategoryImageIds = new Set<number>();

  handleProductImageError(productId: number | undefined) {
    if (productId !== undefined) {
      this.failedProductImageIds.add(productId);
    }
  }

  isProductImageFailed(productId: number | undefined): boolean {
    return productId !== undefined && this.failedProductImageIds.has(productId);
  }

  getCategoryImage(category: any): string {
    const image = category.image || category.Image;
    if (image) {
      if (image.startsWith('http')) {
        return image;
      }
      return `http://localhost:49857/UploadedImages/${image}`;
    }
    return '';
  }

  handleCategoryImageError(categoryId: number | undefined) {
    if (categoryId !== undefined) {
      this.failedCategoryImageIds.add(categoryId);
    }
  }

  isCategoryImageFailed(categoryId: number | undefined): boolean {
    return categoryId !== undefined && this.failedCategoryImageIds.has(categoryId);
  }

  submitInquiry() {
    alert('Inquiry Sent Successfully! The supplier or admin will reach out to you shortly.');
  }
}
