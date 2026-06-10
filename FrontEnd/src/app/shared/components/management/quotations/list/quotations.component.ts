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
  // --- INBOX / DASHBOARD STATE ---
  rawItems: any[] = [];
  groupedRequests: any[] = [];
  loading = true;
  sellerCompanyId = 2; // Hardcoded for test sessions

  // --- FILTERS STATE ---
  searchQuery: string = '';
  showFavoritesOnly: boolean = false;
  selectedLocation: string = 'All Locations';
  favoritesMap = new Set<string>();

  // --- PRICING EDITOR STATE ---
  selectedRequest: any = null;
  quoteExpiryDate: string = '';
  deliveryCharge: number = 0;
  notes: string = '';
  submitting = false;
  private map: L.Map | undefined;

  // --- TABS & HISTORY STATE ---
  activeTab: 'pending' | 'sent' = 'pending'; 
  sentQuotations: any[] = []; 

  constructor(private mgtService: QuotationService) {}

  ngOnInit() { 
    this.loadRequests(); 
  }

  // ===================================
  // 1. TABS SYSTEM
  // ===================================
  switchTab(tab: 'pending' | 'sent') {
    this.activeTab = tab;
    this.selectedRequest = null;
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
    const tokenString = localStorage.getItem('userClaims') || sessionStorage.getItem('userClaims');
    if (tokenString) {
      const token = JSON.parse(tokenString); 
      this.sellerCompanyId = +token.company_id;
    }
    this.loading = true;
    this.mgtService.getSellerRequests(this.sellerCompanyId).subscribe({
      next: (res) => {
        this.rawItems = (res.data || res.result || res) as any[];
        
        // Group by orderNumber or fallback to REQ-orderId
        const groups = this.rawItems.reduce((acc: any, item: any) => {
          const num = item.orderNumber || 'REQ-' + item.orderId;
          if (!acc[num]) {
            acc[num] = {
              orderNumber: num,
              orderId: item.orderId,
              createdAt: item.createdAt,
              shippingAddress: item.shippingAddress || 'Store Pickup',
              googleMapLocation: item.googleMapLocation,
              status: item.status || 'PENDING',
              isNew: !item.quotedBy, // Mark as new if not quoted yet
              items: []
            };
          }
          acc[num].items.push(item);
          return acc;
        }, {});
        
        this.groupedRequests = Object.values(groups);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // Get list of requests filtered by Search, Location, and Favorites
  get filteredRequests(): any[] {
    return this.groupedRequests.filter((req: any) => {
      // 1. Search Query matches ID or Location
      const query = this.searchQuery?.trim().toLowerCase();
      const matchesSearch = !query || 
                            req.orderNumber?.toLowerCase().includes(query) || 
                            req.shippingAddress?.toLowerCase().includes(query);
      
      // 2. Favorites check
      const matchesFavorites = !this.showFavoritesOnly || this.favoritesMap.has(req.orderNumber);
      
      // 3. Location dropdown filter
      const matchesLocation = this.selectedLocation === 'All Locations' || 
                              req.shippingAddress?.toLowerCase().includes(this.selectedLocation.toLowerCase());
      
      return matchesSearch && matchesFavorites && matchesLocation;
    });
  }

  // Get locations list for filter dropdown (with standard screenshots fallbacks)
  get locations(): string[] {
    const list = new Set(['All Locations', 'Kathmandu', 'Lalitpur', 'Pokhara']);
    this.groupedRequests.forEach((req: any) => {
      if (req.shippingAddress && !req.shippingAddress.includes(',')) {
        list.add(req.shippingAddress);
      }
    });
    return Array.from(list);
  }

  toggleFavorite(orderNumber: string, event: MouseEvent) {
    event.stopPropagation();
    if (this.favoritesMap.has(orderNumber)) {
      this.favoritesMap.delete(orderNumber);
    } else {
      this.favoritesMap.add(orderNumber);
    }
  }

  isFavorited(orderNumber: string): boolean {
    return this.favoritesMap.has(orderNumber);
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
  // 4. PRICING EDITOR LOGIC
  // ===================================
  openPricingEditor(request: any) {
    this.selectedRequest = request;
    
    // Set default expiry date (today + 7 days)
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    this.quoteExpiryDate = expiry.toISOString().split('T')[0];
    
    // Initialize editable pricing fields
    this.selectedRequest.items.forEach((item: any) => {
      item.unitRate = item.unitRate || null;
      item.hasVat = item.hasVat || false;
      item.quoteQuantity = item.requestedQuantity;
    });

    this.deliveryCharge = request.deliveryCharge || 0;
    this.notes = request.notes || '';
    
    setTimeout(() => { this.initMap(); }, 150);
  }

  closePricingEditor() {
    this.selectedRequest = null;
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  initMap() {
    if (this.selectedRequest && this.selectedRequest.googleMapLocation && document.getElementById('quoteMap')) {
        const parts = this.selectedRequest.googleMapLocation.split(',');
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

  // Calculation properties
  getItemSubtotal(item: any): number {
    return (item.quoteQuantity || 0) * (item.unitRate || 0);
  }

  get baseValue(): number {
    if (!this.selectedRequest) return 0;
    return this.selectedRequest.items.reduce((sum: number, item: any) => {
      return sum + this.getItemSubtotal(item);
    }, 0);
  }

  get totalVat(): number {
    if (!this.selectedRequest) return 0;
    return this.selectedRequest.items.reduce((sum: number, item: any) => {
      if (item.hasVat) {
        return sum + (this.getItemSubtotal(item) * 0.13);
      }
      return sum;
    }, 0);
  }

  get grandTotal(): number {
    return this.baseValue + this.totalVat + (this.deliveryCharge || 0);
  }

  submitFinalQuote() {
    const missingRates = this.selectedRequest.items.some((i: any) => !i.unitRate || i.unitRate <= 0);
    if(missingRates) {
       alert("Please enter a valid Unit Rate for all selected products before submitting.");
       return;
    }

    this.submitting = true;
    
    const itemsArr = this.selectedRequest.items.map((i: any) => ({
         orderId: i.orderId,
         orderItemId: i.orderItemId,
         productId: i.productId,
         quantity: i.quoteQuantity,
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
        this.closePricingEditor();
        this.loadRequests(); // Refresh inbox list
      },
      error: () => {
        this.submitting = false;
        alert('Error submitting quotation. Please try again.');
      }
    });
  }
}
