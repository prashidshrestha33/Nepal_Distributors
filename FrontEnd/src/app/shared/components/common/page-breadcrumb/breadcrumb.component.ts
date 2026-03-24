import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbService, Breadcrumb } from '../../../../shared/services/breadcrumb.service'; // update path as needed

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav aria-label="breadcrumb" class="breadcrumb-container" *ngIf="breadcrumbs.length > 1">
      <ol class="breadcrumb">
        
        <!-- Loop through our cached service array -->
        <li *ngFor="let crumb of breadcrumbs; let last = last" class="breadcrumb-item" [class.active]="last">
          
          <!-- Clickable link for previous steps -->
          <a *ngIf="!last" [routerLink]="crumb.url">{{ crumb.label }}</a>
          
          <!-- Just text for the current step -->
          <span *ngIf="last">{{ crumb.label }}</span>
          
          <!-- The ">" divider icon -->
          <span class="separator" *ngIf="!last"> &gt; </span>
        </li>

      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      flex-wrap: wrap;
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: 15px;
      color: #6c757d;
    }
    .breadcrumb-item { display: flex; align-items: center; }
    
    .breadcrumb-item a {
      color: #0d6efd;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
      transition: color 0.2s;
    }
    .breadcrumb-item a:hover {
      color: #0a58ca;
      text-decoration: underline;
    }
    
    .breadcrumb-item.active span {
      color: #495057;
      font-weight: 600;
      text-transform: capitalize;
    }
    
    .separator {
      margin: 0 10px;
      color: #adb5bd;
      font-weight: bold;
    }
  `]
})
export class BreadcrumbComponent {
  breadcrumbs: Breadcrumb[] = [];

  constructor(public breadcrumbService: BreadcrumbService) {
    // Automatically binds our HTML to the routing cache
    this.breadcrumbService.breadcrumbs$.subscribe(res => {
      this.breadcrumbs = res;
    });
  }
}
