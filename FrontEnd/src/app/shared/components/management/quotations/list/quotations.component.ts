import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import * as L from 'leaflet'; 

import { QuotationService } from '../../../../services/management/management.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './quotations.component.html',
  styleUrls: ['./quotations.component.css']
})
export class QuotationsComponent implements OnInit {
  // --- INBOX STATE ---
  rawItems: any[] = [];
  groupedData: any = {};
  groupedAddresses: string[] = [];
  loading = true;
  sellerCompanyId = 2; // Hardcoded for your test session

  // --- TABS & HISTORY STATE ---
  activeTab: 'pending' | 'sent' = 'pending'; 
  sentQuotations: any[] = []; 

  // --- BULK POPUP STATE ---
  selectedBulkItems: any[] = []; 
  deliveryCharge: number = 0;
  notes: string = '';
  submitting = false;
  private map: L.Map | undefined;

  constructor(private mgtService: QuotationService) {}

  ngOnInit() { 
    this.loadRequests(); 
  }

  // ===================================
  // 1. TABS SYSTEM
  // ===================================
  switchTab(tab: 'pending' | 'sent') {
    this.activeTab = tab;
    if (tab === 'pending') {
       this.loadRequests();
    } else {
       this.loadSentHistory();
    }
  }

  // ===================================
  // 2. INBOX LIST LOGIC
  // ===================================
  loadRequests() {
       const tokenString  = localStorage.getItem('userClaims') || sessionStorage.getItem('userClaims');
    if(tokenString)
      {
             const token = JSON.parse(tokenString); 
             this.sellerCompanyId = +token.company_id;
             
      }
    this.loading = true;
    this.mgtService.getSellerRequests(this.sellerCompanyId).subscribe({
      next: (res) => {
        this.rawItems = (res.data || res.result || res) as any[];
        
        this.groupedData = this.rawItems.reduce((group, item) => {
          item.selected = false; // Force starting unchecked!
          
          const addr = item.shippingAddress || 'Store Pickup';
          if (!group[addr]) group[addr] = [];
          group[addr].push(item);
          return group;
        }, {});
        
        this.groupedAddresses = Object.keys(this.groupedData);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  hasSelected(address: string): boolean {
    return this.groupedData[address] && this.groupedData[address].some((i: any) => i.selected);
  }

  countSelected(address: string): number {
    if (!this.groupedData[address]) return 0;
    return this.groupedData[address].filter((i: any) => i.selected).length;
  }

  getImageUrl(imageName: string): string {
    return imageName 
      ? `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(imageName)}`
      : 'assets/images/no-image.png';
  }

  // ===================================
  // 3. SENT HISTORY LOGIC
  // ===================================
  loadSentHistory() {
    this.loading = true;
    this.mgtService.getSentQuotations(this.sellerCompanyId).subscribe({
      next: (res) => {
        this.sentQuotations = (res.data || res.result || res) as any[];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // ===================================
  // 4. BULK POPUP LOGIC
  // ===================================
  openBulkPopup(address: string) {
    this.selectedBulkItems = this.groupedData[address].filter((i: any) => i.selected);
    
    // Safely copy values to the editable 'quoteQuantity' so the original text isn't ruined!
    this.selectedBulkItems.forEach(i => {
       i.unitRate = null;
       i.quoteQuantity = i.requestedQuantity; 
    });
    
    this.deliveryCharge = 0;
    this.notes = '';
    
    setTimeout(() => { this.initMap(); }, 150);
  }

  closePopup() {
    this.selectedBulkItems = [];
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  initMap() {
    if (this.selectedBulkItems.length > 0 && this.selectedBulkItems[0].googleMapLocation) {
        const parts = this.selectedBulkItems[0].googleMapLocation.split(',');
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);

        this.map = L.map('quoteMap').setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

        const icon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41]
        });
        
        L.marker([lat, lng], { icon, draggable: false }).addTo(this.map); 
    }
  }

  // Uses quoteQuantity explicitly!
  get totalAmount(): number {
    let sum = 0;
    this.selectedBulkItems.forEach(item => {
       if(item.unitRate) sum += (item.quoteQuantity * item.unitRate);
    });
    return sum + (this.deliveryCharge || 0);
  }

  submitBulkQuote() {
    const missingRates = this.selectedBulkItems.some(i => !i.unitRate || i.unitRate <= 0);
    if(missingRates) {
       alert("Please enter a valid Unit Rate for all selected products before submitting.");
       return;
    }

    this.submitting = true;
    
    const itemsArr = this.selectedBulkItems.map(i => ({
         orderId: i.orderId,
         orderItemId: i.orderItemId,
         productId: i.productId,
         quantity: i.quoteQuantity, // 👈 Saves the seller's edited stock limit
         unitRate: i.unitRate
    }));

    const payload = {
      quotedBy: this.sellerCompanyId,
      deliveryCharge: this.deliveryCharge || 0,
      notes: this.notes,
      items: itemsArr
    };

    this.mgtService.submitBulkQuote(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.closePopup();
        this.loadRequests(); // Refresh inbox silently!
      },
      error: () => {
        this.submitting = false;
        alert('Error submitting Bulk quotation. Try again.');
      }
    });
  }
}
