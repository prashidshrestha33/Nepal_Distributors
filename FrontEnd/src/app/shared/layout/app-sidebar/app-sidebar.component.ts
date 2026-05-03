import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { combineLatest, Subscription, firstValueFrom } from 'rxjs';
import { StaticValueCatalog } from '../../services/management/management.service';
import { StaticValueService } from '../../services/management/management.service';

interface NavItem {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  queryParams?: { [key: string]: any };
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {

  navItems: NavItem[] = [
    {
      name: "Dashboard",
      path: "/",
      icon: `<img class="w-6 h-6 inline-block" src="https://cdn-icons-png.flaticon.com/512/1828/1828859.png" alt="dashboard">`
    },
    {
      name: "Users",
      path: "/management/users",
      icon: `<img class="w-6 h-6 inline-block" src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" alt="users">`
    },
    {
      name: "Company",
      path: "/management/company",
      icon: `<img class="w-6 h-6 inline-block" src="https://cdn-icons-png.flaticon.com/512/1946/1946356.png" alt="company">`
    },
    {
      name: "Product",
      path: "/management/products",
      icon: `<img class="w-6 h-6 inline-block" src="https://cdn-icons-png.flaticon.com/512/891/891462.png" alt="product">`
    },
    {
      name: "Product Category",
      path: "/management/categories",
      icon: `<img class="w-6 h-6 inline-block" src="https://cdn-icons-png.flaticon.com/512/2910/2910766.png" alt="category">`
    },
    {
      name: "Setting",
      path: "/management/static-values",
      icon: `<img class="w-6 h-6 inline-block" src="https://cdn-icons-png.flaticon.com/512/3524/3524635.png" alt="setting">`
    }
  ];

  othersItems: NavItem[] = [
    {
      name: "Authentication",
      subItems: [
        { name: "Sign In", path: "/signin", pro: false },
        { name: "Sign Up", path: "/register-company", pro: false },
      ],
      icon: `<img class="w-6 h-6 inline-block" src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="auth">`
    },
    {
      name: "Feedback",
      subItems: [
        { name: "Inbox", path: "/management/feedback/inbox", pro: false },
        { name: "Submit Feedback", path: "/management/feedback/submit", pro: false },
      ],
      icon: `<img class="w-6 h-6 inline-block" src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png" alt="feedback">`
    }
  ];

  openSubmenu: string | null = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;
  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;
  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private staticValueService: StaticValueService
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  async ngOnInit() {
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) this.setActiveMenuFromRoute(this.router.url);
      })
    );

    this.setActiveMenuFromRoute(this.router.url);

    // Add Brand and Manufacture dynamically with online icons
    try {
      const catalogs: StaticValueCatalog[] = await firstValueFrom(this.staticValueService.getStaticValuesCatagory());
      catalogs.forEach(catalog => {
        if (catalog.catalogName === 'Brand') {
          this.navItems.push({
            name: catalog.catalogName,
            path: '/management/static-values',
            queryParams: { catalogId: catalog.catalogId },
            icon: `<img class="w-6 h-6 inline-block" src="https://cdn-icons-png.flaticon.com/512/1086/1086933.png" alt="brand">`
          });
        } else if (catalog.catalogName === 'Manufacture') {
          this.navItems.push({
            name: catalog.catalogName,
            path: '/management/static-values',
            queryParams: { catalogId: catalog.catalogId },
            icon: `<img class="w-6 h-6 inline-block" src="https://cdn-icons-png.flaticon.com/512/2910/2910768.png" alt="manufacture">`
          });
        }
      });
    } catch (error) {
      console.error('Failed to fetch catalog items', error);
    }

    // Close submenus when all states are false
    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            this.cdr.detectChanges();
          }
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isActive(path?: string): boolean {
    return path ? this.router.url === path : false;
  }

  toggleSubmenu(name: string): void {
    this.openSubmenu = this.openSubmenu === name ? null : name;
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    const menuGroups = [{ items: this.navItems, prefix: 'main' }, { items: this.othersItems, prefix: 'others' }];
    menuGroups.forEach(group => {
      group.items.forEach((nav, i) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            if (currentUrl === subItem.path) {
              const key = `${group.prefix}-${i}`;
              this.openSubmenu = key;
              setTimeout(() => {
                const el = document.getElementById(key);
                if (el) this.subMenuHeights[key] = el.scrollHeight;
                this.cdr.detectChanges();
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) this.sidebarService.setMobileOpen(false);
    }).unsubscribe();
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) this.sidebarService.setHovered(true);
    }).unsubscribe();
  }
}