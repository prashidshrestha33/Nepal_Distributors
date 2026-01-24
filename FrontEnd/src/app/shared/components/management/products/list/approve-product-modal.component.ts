import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Product } from '../../../../services/management/management.service';

@Component({
  selector: 'app-approve-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-3xl p-8 relative">
        <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Approve Product</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 dark:text-gray-200">
          <div><span class="font-semibold">SKU:</span> {{ product?.sku }}</div>
          <div><span class="font-semibold">Name:</span> {{ product?.name }}</div>
          <div class="md:col-span-2"><span class="font-semibold">Description:</span> {{ product?.description }}</div>
          <div><span class="font-semibold">Short Description:</span> {{ product?.shortDescription }}</div>
          <div><span class="font-semibold">Category:</span> {{ product?.categoryName }}</div>
          <div><span class="font-semibold">Brand:</span> {{ product?.brandName }}</div>
          <div><span class="font-semibold">Manufacturer ID:</span> {{ product?.manufacturerId }}</div>
          <div><span class="font-semibold">Rate:</span> {{ product?.rate }}</div>
          <div><span class="font-semibold">HsCode:</span> {{ product?.hsCode }}</div>
          <div><span class="font-semibold">SEO Title:</span> {{ product?.seoTitle }}</div>
          <div><span class="font-semibold">SEO Description:</span> {{ product?.seoDescription }}</div>
          <div><span class="font-semibold">Created By:</span> {{ product?.createdBy }}</div>
          <div><span class="font-semibold">Updated At:</span> {{ product?.updatedAt | date:'medium' }}</div>
          <div><span class="font-semibold">Is Featured:</span> {{ product?.isFeatured ? 'Yes' : 'No' }}</div>
          <div><span class="font-semibold">Image:</span>
            <img *ngIf="product?.imageUrl; else noImg" [src]="product?.imageUrl" alt="Product Image" class="w-32 h-32 object-cover rounded border mt-1" />
            <ng-template #noImg><span>N/A</span></ng-template>
          </div>
          <div class="md:col-span-2 flex items-center">
            <span class="font-semibold">Current Status:</span>
            <span class="ml-2 px-3 py-1 rounded-full"
                  [ngClass]="{
                    'bg-yellow-100 text-yellow-800': product?.status === 'Pending',
                    'bg-green-100 text-green-800': product?.status === 'Approved',
                    'bg-gray-200 text-gray-700': !product?.status
                  }">
              {{ product?.status || 'Pending' }}
            </span>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-8">
          <button (click)="onCancel()" class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800">Cancel</button>
          <button (click)="onSave()" [disabled]="product?.status === 'Approved'" class="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">Approve</button>
        </div>
        <button (click)="onCancel()" class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
      </div>
    </div>
  `
})
export class ApproveProductModalComponent {
  @Input() product: (Product & { categoryName?: string; brandName?: string }) | null = null;
  @Input() status: string = 'Pending';
  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  onSave() {
    this.save.emit(this.status);
  }
  onCancel() {
    this.cancel.emit();
  }
}
