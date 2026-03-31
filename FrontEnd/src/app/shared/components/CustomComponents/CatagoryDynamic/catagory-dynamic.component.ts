import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CompanyService } from '../../../services/management/company.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-category-dynamic',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './catagory-dynamic.component.html',
  styleUrls: ['./catagory-dynamic.component.css']
})
export class CatagoryDynamicComponent implements OnInit, OnChanges {

  // Inputs
  @Input() companyId!: number;
  @Input() excludeCategoryIds?: (number | undefined | null)[] = [];
  @Input() initialCategoryId?: number | null;

  // Output
  @Output() categorySelected = new EventEmitter<number>();
  @Output() categoryPathSelected = new EventEmitter<string>();

  // State
  loading = false;
  error: string | null = null;
  private lastLoadedId?: number | null = undefined;

  categoryLevels: { parentId: number; categories: any[] }[] = [];
  selectedPath: (number | null)[] = [];

  constructor(
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Only load root if no initial ID is present
    if (!this.initialCategoryId) {
      this.loadRootCategories();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const currentId = changes['initialCategoryId']?.currentValue;
    if (currentId && currentId > 0 && currentId !== this.lastLoadedId) {
      console.log('CatagoryDynamic: Detected initialCategoryId change, loading path for:', currentId);
      this.lastLoadedId = currentId;
      this.loadInitialPath(currentId);
    }
  }

  private filterCategories(categories: any[]): any[] {
    if (this.excludeCategoryIds && this.excludeCategoryIds.length > 0) {
      return categories.filter((c: any) => !this.excludeCategoryIds!.includes(c.id));
    }
    return categories;
  }

  private processResponse(res: any): any[] {
    const list = Array.isArray(res) ? res : res?.data || res?.result || [];
    return this.filterCategories(list);
  }

  loadRootCategories() {
    this.loading = true;
    this.companyService.getCategoriesparent(0).subscribe({
      next: (res: any) => {
        this.categoryLevels = [{ parentId: 0, categories: this.processResponse(res) }];
        this.selectedPath = [null];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load categories';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private async loadInitialPath(targetId: number) {
    this.loading = true;
    this.error = null;
    try {
      // 1. Trace biological path back to root
      const pathIds: number[] = [];
      let currentId: number | null = targetId;

      while (currentId) {
        try {
          const cat: any = await lastValueFrom(this.companyService.getCategoryById(currentId));
          if (cat) {
            pathIds.unshift(cat.id);
            currentId = cat.parentId ? Number(cat.parentId) : null;
          } else {
            break;
          }
        } catch (e) {
          console.warn(`Could not fetch category ${currentId} for path tracing`, e);
          break;
        }
      }

      console.log('CatagoryDynamic: Traced Path IDs:', pathIds);

      // 2. Sequentially build the levels
      const newLevels: { parentId: number; categories: any[] }[] = [];
      const newPath: (number | null)[] = [];

      // Always load the root options
      const rootRes = await lastValueFrom(this.companyService.getCategoriesparent(0));
      newLevels.push({ parentId: 0, categories: this.processResponse(rootRes) });

      for (let i = 0; i < pathIds.length; i++) {
        const cid = pathIds[i];
        newPath[i] = cid;

        // Fetch children for THIS selected ID
        const childRes = await lastValueFrom(this.companyService.getCategoriesparent(cid));
        const children = this.processResponse(childRes);

        if (children.length > 0) {
          newLevels.push({ parentId: cid, categories: children });
          // If this was the last ID in our path, the NEXT dropdown starts at null
          if (i === pathIds.length - 1) {
            newPath.push(null);
          }
        }
      }

      this.categoryLevels = newLevels;
      this.selectedPath = newPath;

    } catch (err) {
      console.error('Critical failure in category path loading', err);
      this.loadRootCategories(); // fallback
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onCategorySelect(levelIndex: number, selectedId: number | null) {
    // Remove deeper levels if parent changes
    this.categoryLevels = this.categoryLevels.slice(0, levelIndex + 1);
    this.selectedPath = this.selectedPath.slice(0, levelIndex + 1);
    this.selectedPath[levelIndex] = selectedId ?? null;

    let finalSelected: number | null = null;
    for (let i = this.selectedPath.length - 1; i >= 0; i--) {
      if (this.selectedPath[i] != null) {
        finalSelected = this.selectedPath[i];
        break;
      }
    }

    if (finalSelected != null) {
      this.categorySelected.emit(finalSelected);
    } else {
      this.categorySelected.emit(0);
    }

    // Create full path slug
    let pathNames: string[] = [];
    for (let id of this.selectedPath) {
      if (id != null) {
        const name = this.getCategoryNameById(id);
        if (name) {
          pathNames.push(name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
      }
    }
    this.categoryPathSelected.emit(pathNames.join('-'));

    if (!selectedId) return;

    this.companyService.getCategoriesparent(selectedId).subscribe({
      next: (res: any) => {
        const children = this.processResponse(res);
        if (children.length > 0) {
          this.categoryLevels.push({ parentId: selectedId, categories: children });
          this.selectedPath.push(null);
        }
      },
      error: () => console.error('Failed to load child categories')
    });
  }

  getCategoryNameById(id: number | null): string {
    if (id == null) return '';
    for (let level of this.categoryLevels) {
      const found = level.categories.find(cat => cat.id === id);
      if (found) return found.name;
    }
    return '';
  }
}