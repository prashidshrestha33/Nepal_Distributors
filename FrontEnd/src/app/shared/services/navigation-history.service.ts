import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BreadcrumbService, Breadcrumb } from './breadcrumb.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationHistoryService {

  private history: Breadcrumb[][] = []; // stack of breadcrumb arrays

  constructor(private router: Router, private breadcrumbService: BreadcrumbService) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const snapshot = this.router.routerState.snapshot.root;

        // Build breadcrumb for current page (titles only)
        const crumbs = this.breadcrumbService.buildBreadCrumb(snapshot);

        // Only push new breadcrumb if it's different from last
        const last = this.history.length ? this.history[this.history.length - 1] : [];
        if (JSON.stringify(last.map(c => c.title)) !== JSON.stringify(crumbs.map(c => c.title))) {
          this.history.push(crumbs);
        }
      });
  }

  // Get the **current breadcrumb trail**
  getCurrentTrail(): Breadcrumb[] {
    return this.history.length ? this.history[this.history.length - 1] : [];
  }

  // Go back to previous breadcrumb trail
  goBack() {
    if (this.history.length > 1) {
      this.history.pop(); // remove current
      const previous = this.history[this.history.length - 1];
      const url = previous.length ? previous[previous.length - 1].url : '/';
      this.router.navigateByUrl(url || '/');
    } else {
      this.router.navigate(['/']); // fallback
    }
  }

  // Clear to root
  clearToRoot() {
    if (this.history.length > 0) {
      this.history = [this.history[0]];
    }
  }
}
