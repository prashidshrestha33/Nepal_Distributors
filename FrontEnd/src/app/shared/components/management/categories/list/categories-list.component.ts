import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/management/management.service';
import type { Category } from '../../../services/management/management.service';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Categories</h1>
        <a href="/categories/add" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Add Category</a>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <input type="text" placeholder="Search..." [(ngModel)]="searchTerm" (keyup)="onSearch()" 
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-100 border-b">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th class="px-6 py-3 text-left text-sm font-semibold">Description</th>
              <th class="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th class="px-6 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cat of filteredItems" class="border-b hover:bg-gray-50">
              <td class="px-6 py-4 text-sm">{{ cat.name }}</td>
              <td class="px-6 py-4 text-sm">{{ cat.description || '-' }}</td>
              <td class="px-6 py-4"><span [ngClass]="{'bg-green-200': cat.status==='active', 'bg-yellow-200': cat.status==='pending'}" class="px-3 py-1 rounded-full text-xs">{{ cat.status }}</span></td>
              <td class="px-6 py-4 text-center">
                <button *ngIf="cat.status==='pending'" (click)="approve(cat.id!)" class="text-green-500 text-sm">Approve</button>
                <button (click)="delete(cat.id!)" class="text-red-500 text-sm ml-2">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CategoriesListComponent implements OnInit {
  items: Category[] = [];
  filteredItems: Category[] = [];
  searchTerm = '';
  constructor(private service: CategoryService) {}
  ngOnInit() { this.load(); }
  load() { this.service.getCategories().subscribe((data: Category[]) => { this.items = data; this.filteredItems = data; }); }
  onSearch() { this.filteredItems = this.items.filter(i => i.name.toLowerCase().includes(this.searchTerm.toLowerCase())); }
  approve(id: number) { this.service.approveCategory(id).subscribe(() => this.load()); }
  delete(id: number) { if(confirm('Are you sure?')) this.service.deleteCategory(id).subscribe(() => this.load()); }
}
