import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomepageService, HomepageResponse, HeroBanner } from './services/homepage.service';
import { finalize } from 'rxjs/operators';
import { environment } from '../environments/environment';

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
  
  // Search and modal display states
  searchQuery = signal<string>('');
  showTermsModal = signal<boolean>(false);
  showPrivacyModal = signal<boolean>(false);
  showSearchPage = signal<boolean>(false);
  selectedCategory = signal<number | null>(null);
  
  // Computed reactive selections for the page sections
  filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const catId = this.selectedCategory();
    let allProducts = this.homepageData()?.products || [];
    
    if (catId) {
      allProducts = allProducts.filter(p => p.categoryId === catId || (p as any).CategoryId === catId);
    }
    
    if (!query) return allProducts;
    return allProducts.filter(p => {
      const name = (p.name || p.Name || '').toLowerCase();
      const desc = (p.description || p.Description || '').toLowerCase();
      const company = (p.companyName || p.CompanyName || '').toLowerCase();
      return name.includes(query) || desc.includes(query) || company.includes(query);
    });
  });

  trendingProducts = computed(() => {
    const list = this.filteredProducts();
    const featured = list.filter(p => p.isFeatured || (p as any).IsFeatured);
    return featured.length > 0 ? featured : list.filter((_, idx) => idx % 2 === 0);
  });

  newProducts = computed(() => {
    return this.filteredProducts();
  });

  advertisedProducts = computed(() => {
    // Select a subset of products (e.g. index % 3 === 1) as advertised, capped at 3 items
    return this.filteredProducts().filter((_, idx) => idx % 3 === 1).slice(0, 3);
  });
  
  private carouselInterval: any;
  
  // Static stats for a premium B2B directory look
  stats = [
    { value: '10,000+', label: 'Products Listed' },
    { value: '500+', label: 'Verified Businesses' },
    { value: '100+', label: 'Quoted Orders' },
    { value: '77', label: 'Districts Covered' }
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
    window.open(environment.adminUrl, '_blank');
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
      return this.getImageUrl(defaultImage);
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
      return this.getImageUrl(image);
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

  getImageUrl(imageName: string): string {
    if (!imageName) return '';
    if (imageName.startsWith('http')) return imageName;
    return `${environment.apiUrl}/CompanyFile?fileName=${encodeURIComponent(imageName)}`;
  }
}
