import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly CACHE_KEY = 'app_breadcrumbs';
  
  // BehaviorSubject holds our state
  private breadcrumbs = new BehaviorSubject<Breadcrumb[]>([]);
  breadcrumbs$ = this.breadcrumbs.asObservable();

  constructor(private router: Router) {
    // 1. Load old history from cache on reload
    this.loadFromCache();

    // 2. Listen to ALL angular routing events
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateHistory(event.urlAfterRedirects);
    });
  }  private updateHistory(url: string) {
    let cleanUrl = url.split('?')[0]; // Remove query params like ?id=123

    // 🔥 FIX: Remove trailing slashes (e.g. /products/ becomes /products)
    if (cleanUrl.endsWith('/') && cleanUrl.length > 1) {
       cleanUrl = cleanUrl.slice(0, -1);
    }

    // Always reset fully if heading to the main dashboard/home
    if (cleanUrl === '' || cleanUrl === '/' || cleanUrl === '/home' || cleanUrl === '/dashboard') {
      this.setBreadcrumbs([{ label: 'Home', url: '/home' }]);
      return;
    }

    let current = this.breadcrumbs.getValue();
    
    // Safety check: Always keep Home as the root
    if (current.length === 0 || current[0].label !== 'Home') {
      current = [{ label: 'Home', url: '/home' }];
    }

    // SCENARIO 1: User clicked backwards using an existing breadcrumb link
    const existingIndex = current.findIndex(b => b.url === cleanUrl);
    if (existingIndex > -1) {
      current = current.slice(0, existingIndex + 1);
      this.setBreadcrumbs(current);
      return;
    }

    // SCENARIO 2: Reset if user clicks a main sidebar link!
    // 💡 IMPORTANT: Put EXACTLY what shows in your browser address bar here
    const mainMenuRoutes = [
      '/company', 
      '/products', 
      '/orders', 
      '/quotations', 
      '/users',
      '/categories',
      // If your app uses a prefix like /admin/ or /management/, add them!
      '/management/products',
      '/management/orders',
      '/management/quotations'
    ]; 
    
    // 🔥 FIX: Check if it's an exact match OR if the URL cleanly ends with the base route 
    const isMainMenu = mainMenuRoutes.some(route => 
       cleanUrl === route || cleanUrl.endsWith(route)
    );

    if (isMainMenu) {
       current = [{ label: 'Home', url: '/home' }];
    }

    // SCENARIO 3: Append the new page to the end of the chain
    const label = this.generateLabel(cleanUrl);
    current.push({ label, url: cleanUrl });

    // Save and emit
    this.setBreadcrumbs(current);
  }

  // Generates 'Add Order' from '/orders/add-order' 
  private generateLabel(url: string): string {
    const segments = url.split('/').filter(x => x.length > 0);
    let lastSegment = segments[segments.length - 1];

    if (!lastSegment) return 'Page';

    // Capitalize and replace dashes with spaces
    lastSegment = lastSegment.replace(/-/g, ' ');
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }

  // Updates the label of the last breadcrumb
  updateLastBreadcrumbLabel(newLabel: string) {
    const current = this.breadcrumbs.getValue();
    if (current.length > 0) {
      current[current.length - 1].label = newLabel;
      this.setBreadcrumbs(current);
    }
  }

  private setBreadcrumbs(breadcrumbs: Breadcrumb[]) {
    this.breadcrumbs.next(breadcrumbs);
    // 💾 Save to Cache!
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(breadcrumbs));
  }

  private loadFromCache() {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (cached) {
      try {
        this.breadcrumbs.next(JSON.parse(cached));
      } catch (e) {
        this.breadcrumbs.next([{ label: 'Home', url: '/home' }]);
      }
    } else {
      this.breadcrumbs.next([{ label: 'Home', url: '/home' }]);
    }
  }
}
