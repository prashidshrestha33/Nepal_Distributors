import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 👈 Required for the dropdowns
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { QuotationService } from '../../../../services/management/management.service'; 
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-seller-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule], 
  templateUrl: './seller-kanban.component.html',
  styleUrls: ['./seller-kanban.component.css']
})
export class SellerKanbanComponent implements OnInit {
  viewMode: 'board' | 'list' = 'board';
  loading = true;
  sellerCompanyId = 2; // Hardcoded test session

  colInprogress: any[] = [];
  colOutForDelivery: any[] = [];
  colDelivered: any[] = [];
  colCompleted: any[] = [];

  allOrdersFlat: any[] = []; 

  constructor(private mgtService: QuotationService) {}

  ngOnInit() { this.loadOrders(); }

  loadOrders() {
    this.loading = true;
    
    // 💡 FIXED: Safely using your ManagementService
    this.mgtService.getSellerConfirmedOrders(this.sellerCompanyId).subscribe(res => {
        const data = (res.data || res.result || res) as any[];
        this.allOrdersFlat = data;
        
        this.colInprogress = [];
        this.colOutForDelivery = [];
        this.colDelivered = [];
        this.colCompleted = [];

        data.forEach(order => {
           if (order.status === 'Inprogress') this.colInprogress.push(order);
           else if (order.status === 'Out for Delivery') this.colOutForDelivery.push(order);
           else if (order.status === 'Delivered (Payment Received)') this.colDelivered.push(order);
           else if (order.status === 'Delivery Completed') this.colCompleted.push(order);
           else this.colInprogress.push(order); 
        });

        this.loading = false;
    });
  }

  // ============================================
  // 🔥 THE DRAG AND DROP ENGINE 🔥
  // ============================================
  drop(event: CdkDragDrop<any[]>, targetStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      const movedOrder = event.container.data[event.currentIndex];
      movedOrder.status = targetStatus;

      // 💡 FIXED: Safely using ManagementService to sync the drop to SQL
      this.mgtService.updateOrderStatus(movedOrder.orderId, targetStatus).subscribe({
         error: (err) => {
            alert('Failed to sync card with server. Reverting board...');
            this.loadOrders(); 
         }
      });
    }
  }

  // Used strictly inside the "List View" layout
  updateStatusListMode(orderId: number, newStatus: string) {
    this.mgtService.updateOrderStatus(orderId, newStatus).subscribe({
       next: () => console.log('Status silently updated!'),
       error: () => { 
          alert('Update failed! Reverting...'); 
          this.loadOrders(); 
       }
    });
  }

  switchView(mode: 'board' | 'list') {
    this.viewMode = mode;
  }

  getImageUrl(imageName: string): string {
    return imageName ? `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(imageName)}` : 'assets/images/no-image.png';
  }
}
