import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';

export interface Breadcrumb {
  title: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {

  buildBreadCrumb(route: ActivatedRouteSnapshot, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {

    const routeTitle = route.data && route.data['title'] ? route.data['title'] : '';

    const routeUrl = route.url.map(segment => segment.path).join('/');
    const nextUrl = routeUrl ? `${url}/${routeUrl}` : url;

    if (routeTitle) {
      breadcrumbs.push({ title: routeTitle, url: nextUrl });
    }

    if (route.firstChild) {
      return this.buildBreadCrumb(route.firstChild, nextUrl, breadcrumbs);
    }

    return breadcrumbs;
  }
}
