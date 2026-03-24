import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet'; // 👈 FREE LEAFLET IMPORT

import { OrderService } from '../../../../services/management/management.service';
import { ProductListPopupComponent } from '../../../CustomComponents/ProductList/product-list-popup.component';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ProductListPopupComponent], 
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.css']
})
export class OrderFormComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;
  
  // Array storing items pulled from popup popup
  tempOrderItems: any[] = [];
  showProductPopup = false; 

  // Free Map Variables
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  mapSearchQuery: string = '';
  isSearchingMap: boolean = false;

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private router: Router
  ) {
    this.form = this.fb.group({
      orderNumber: [{ value: '', disabled: true }, Validators.required],
      remarks: [''],
      google_map_location: [''] // Stores Lat/Lng coords
    });
  }

  ngOnInit() {
    // Generate secure random Quotation Number
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.form.patchValue({ orderNumber: 'ORD-' + randomNum });
  }

  // ==========================================
  // FREE MAP INIT & SEARCH LOGIC
  // ==========================================
  ngAfterViewInit() {
    this.initMap();
  }

  private initMap(): void {
    const defaultLat = 27.7172; // Kathmandu default
    const defaultLng = 85.3240;

    // Attach to HTML <div id="map">
    this.map = L.map('map').setView([defaultLat, defaultLng], 14);

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });

    this.marker = L.marker([defaultLat, defaultLng], { icon, draggable: true }).addTo(this.map);

    // Update location when dragged
    this.marker.on('dragend', (event) => {
      const position = event.target.getLatLng();
      this.updateLocationForm(position.lat, position.lng);
    });

    // Update location when clicked
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      if (this.marker) {
        this.marker.setLatLng(event.latlng);
        this.updateLocationForm(event.latlng.lat, event.latlng.lng);
      }
    });

    // 💡 Example DB Override: Put your fetched company DB location here
    const companyDbLocation = "27.6915, 85.3341"; 
    
    if (companyDbLocation && companyDbLocation.includes(',')) {
      const parts = companyDbLocation.split(',');
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      
      this.map.setView([lat, lng], 14);
      this.marker.setLatLng([lat, lng]);
      this.updateLocationForm(lat, lng);
    }
  }

  // Uses Nominatim free geocoding
  async searchLocation() {
    if (!this.mapSearchQuery || this.mapSearchQuery.trim() === '') return;
    
    this.isSearchingMap = true;
    
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.mapSearchQuery)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        if (this.map && this.marker) {
          this.map.setView([lat, lon], 14);
          this.marker.setLatLng([lat, lon]);
          this.updateLocationForm(lat, lon);
        }
      } else {
        alert('Location not found. Try a different search term or city.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error connecting to map search.');
    } finally {
      this.isSearchingMap = false;
    }
  }

  private updateLocationForm(lat: number, lng: number) {
     this.form.patchValue({
         google_map_location: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
     });
  }

  // ==========================================
  // DIRECT POPUP HANDLERS
  // ==========================================
  openProductSelection() {
    this.showProductPopup = true;
  }

  closePopup() {
    this.showProductPopup = false;
  }

  onProductsConfirmed(returnedItemsArray: any[]) {
    // Array comes back heavily mapped securely from popup map architecture!
    this.tempOrderItems = [...returnedItemsArray]; 
    this.showProductPopup = false;
  }

  removeOrderItem(index: number) {
    this.tempOrderItems.splice(index, 1);
  }

  // ==========================================
  // SUBMIT ORDER (No Price Included!)
  // ==========================================
  onSubmit() {
    if (this.form.valid) {
      if (this.tempOrderItems.length === 0) {
        this.error = "Please add at least one product.";
        return;
      }

      this.loading = true;
      this.error = null;

      const orderPayload: any = {
        // Must use rawValue to get auto-filled but disabled number
        orderNumber: this.form.getRawValue().orderNumber,
        remarks: this.form.value.remarks,
        status: 'processing', // Forced status
        totalAmount: 0, // Since quote based, force value to 0
        google_map_location: this.form.value.google_map_location,
        items: this.tempOrderItems
      };
      
      this.orderService.createOrder(orderPayload).subscribe({
        next: () => {
          this.router.navigate(['/orders']); 
        },
        error: (err) => {
          this.error = 'Failed to create quotation. Please try again.';
          console.error('Error creating quote:', err);
          this.loading = false;
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
