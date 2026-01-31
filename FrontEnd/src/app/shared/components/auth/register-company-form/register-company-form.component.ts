import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { SignupFlowService } from '../../../services/signup-flow.service';
import { FormDataService } from '../../../services/form-data.service';
import { RegistrationFlowService } from '../../../services/registration-flow.service';
import { CatalogService } from '../../../services/catalog.service';
import { environment } from '../../../../../environments/environment';

// Phone number validator: 7-10 digits only
function phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; // Allow empty (required validator handles it)
  }
  
  const phoneNumber = control.value.toString().trim();
  
  // Check if it contains only digits
  if (!/^\d+$/.test(phoneNumber)) {
    return { invalidPhoneFormat: true };
  }
  
  // Check length between 7 and 10
  if (phoneNumber.length < 7 || phoneNumber.length > 10) {
    return { phoneLengthInvalid: true };
  }
  
  return null;
}

@Component({
  selector: 'app-register-company-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-company-form.component.html',
  styles: [],
})
export class RegisterCompanyFormComponent implements OnInit, OnDestroy {
  private api = environment.apiBaseUrl;
  form: FormGroup;
  loading = false;
  createdCompanyId: number | null = null;
  error: string | null = null;
  lgmessage: string | null = null;
  fileName = '';
  filePreview: string | null = null;
  companyTypes: any[] = []; // Store fetched company types
  loadingCompanyTypes = false; // Loading state for company types
  // Map picker state
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  showMapModal = false;
  private leaflet: any = null; // will hold imported Leaflet module
  private map: any = null;
  private marker: any = null;
  private mapInitialized = false;
  private selectedLatLng: { lat: number; lng: number } | null = null;
  
  // Registration flow state
  isComingFromSignup = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private flow: SignupFlowService,
    private router: Router,
    private formDataService: FormDataService,
    private registrationFlowService: RegistrationFlowService,
    private catalogService: CatalogService,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      companyPerson: ['', Validators.required],
      mobilePhone: [''],
      landLinePhone: [''],
      registrationDocument: [null, Validators.required], // To hold the file
      companyType: ['', Validators.required],
      address: ['', Validators.required],
      googleMapLocation: ['', Validators.required],
    });
  }

  ngOnInit(): void {
      const Messagelg = localStorage.getItem('Messagelg');
    
    if (Messagelg && Messagelg!="") {
        this.lgmessage=Messagelg;
    }
    // Fetch company types from API
    this.loadCompanyTypes();

    // Check if coming from signup form
    this.isComingFromSignup = this.registrationFlowService.isComingFromSignup();
    
    if (this.isComingFromSignup) {
      // Coming from signup - load and pre-fill saved data
      const preFillData = this.registrationFlowService.getFormData();
      if (preFillData) {
        this.form.patchValue(preFillData);
      } else {
        // Try loading from FormDataService as fallback
        const savedCompanyData = this.formDataService.getCompanyData();
        if (savedCompanyData) {
          this.form.patchValue(savedCompanyData);
        }
      }
      // After pre-filling, reset the flag so direct navigation doesn't pre-fill
      this.registrationFlowService.setComingFromSignup(false);
    } else {
      // NOT coming from signup - direct navigation detected
      // Clear everything: form, localStorage, and any saved data
      this.form.reset();
      this.fileName = '';
      this.filePreview = null;
      this.createdCompanyId = null;
      this.error = null;
      
      
      // Clear localStorage
      localStorage.removeItem('companyFormData');
      localStorage.removeItem('registrationFlowData');
      localStorage.removeItem('signupFormData');
      
      // Clear FormDataService
      this.formDataService.clearCompanyData();
      
      // Clear RegistrationFlowService
      this.registrationFlowService.clearFormData();
    }
  }

  /**
   * Load company types from API
   */
  private loadCompanyTypes(): void {
    this.loadingCompanyTypes = true;
    const apiUrl = `${this.api}/api/public/companyType`
    this.http.get<any>(apiUrl).subscribe({
      next: (response: any) => {
        console.log('Company Types API Response:', response);
        this.companyTypes = [];
        
        // Helper function to extract CatalogType/name from an item
        const extractName = (item: any): string => {
          return item?.catalogType || item?.catalogName || item?.name || item?.displayName || item?.title || '';
        };
        
        // Handle different response structures
        try {
         
           this.companyTypes = response.result || [];
        } catch (e) {
          console.error('Error processing response:', e);
        }
        
        console.log('Processed company types:', this.companyTypes);
        this.loadingCompanyTypes = false;
      },
      error: (err: any) => {
        console.error('Error loading company types:', err);
        this.loadingCompanyTypes = false;
        this.companyTypes = [];
      }
    });
  }

  // Open the map picker modal (lazy initializes Leaflet)
  async openMapPicker() {
    this.showMapModal = true;
    // allow modal to render
    await new Promise(r => setTimeout(r, 100));
    if (!this.mapInitialized) {
      await this.initLeaflet();
      // Try to get user's current location and update marker
      this.getCurrentLocationAndUpdateMarker();
    } else {
      // Map already initialized - reinitialize to fix display issues
      this.mapInitialized = false;
      this.map = null;
      this.marker = null;
      await this.initLeaflet();
      this.getCurrentLocationAndUpdateMarker();
    }
  }

  // Get user's current location and update marker position
  private getCurrentLocationAndUpdateMarker() {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.updateMarkerLocation(lat, lng);
      },
      (error) => {
        console.warn('Error getting user location:', error);
        // Keep default location (Kathmandu) if geolocation fails
      }
    );
  }

  // Update marker to new location
  private updateMarkerLocation(lat: number, lng: number) {
    if (!this.marker || !this.map) return;

    this.selectedLatLng = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
    this.marker.setLatLng([lat, lng]);
    this.map.setView([lat, lng], 13);
    
    // Ensure the map updates properly
    setTimeout(() => { 
      try { this.map.invalidateSize(); } catch (e) {} 
    }, 50);
  }

  closeMapPicker() {
    this.showMapModal = false;
  }

  // Save the selected location into the form (as "lat,lng")
  saveLocation() {
    if (!this.selectedLatLng) {
      // if no selection, try using marker position if present
      if (this.marker) {
        const p = this.marker.getLatLng();
        this.selectedLatLng = { lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) };
      }
    }

    if (this.selectedLatLng) {
      const val = `${this.selectedLatLng.lat},${this.selectedLatLng.lng}`;
      this.form.get('googleMapLocation')?.setValue(val);
      this.form.get('googleMapLocation')?.markAsTouched();
      this.form.get('googleMapLocation')?.updateValueAndValidity();
    }
    this.showMapModal = false;
  }

  // Lazy load Leaflet and initialize the map
  private async initLeaflet() {
    // Try to dynamic import Leaflet (preferred when installed via npm)
    try {
      // @ts-ignore: allow dynamic import and handle missing package by falling back to CDN
      const Lmod = await import('leaflet');
      this.leaflet = Lmod.default || Lmod;
    } catch (e) {
      // Fallback: load Leaflet from CDN if package not installed
      await this.loadLeafletFromCDN();
      // @ts-ignore
      this.leaflet = (window as any).L;
    }

    // Ensure Leaflet CSS is present (CDN fallback handled by loadLeafletFromCDN)

    // Create map
    const L = this.leaflet;
    const container = this.mapContainer?.nativeElement;
    if (!container) return;

    // Fix default marker icons (required when Leaflet is loaded)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // default center: Kathmandu
    const DEFAULT = { lat: 27.7172, lng: 85.3240, zoom: 13 };
    this.map = L.map(container, { center: [DEFAULT.lat, DEFAULT.lng], zoom: DEFAULT.zoom });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // initialize marker if form already has a value
    const current = (this.form.get('googleMapLocation')?.value || '').toString();
    if (current) {
      const [latStr, lngStr] = current.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.selectedLatLng = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
        this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
        this.map.setView([lat, lng], DEFAULT.zoom);
      }
    }

    if (!this.marker) {
      // Place marker at center
      this.marker = L.marker([DEFAULT.lat, DEFAULT.lng], { draggable: true }).addTo(this.map);
      this.selectedLatLng = { lat: +DEFAULT.lat.toFixed(6), lng: +DEFAULT.lng.toFixed(6) };
    }

    // click to move marker
    this.map.on('click', (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      this.moveMarker(lat, lng);
    });

    // marker drag
    this.marker.on('dragend', (e: any) => {
      const p = this.marker.getLatLng();
      this.selectedLatLng = { lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) };
    });

    // After everything, invalidate to render correctly (multiple delays to ensure proper rendering)
    setTimeout(() => { try { this.map.invalidateSize(); } catch (e) {} }, 100);
    setTimeout(() => { try { this.map.invalidateSize(); } catch (e) {} }, 200);
    this.mapInitialized = true;
  }

  private moveMarker(lat: number, lng: number) {
    if (!this.marker) return;
    this.marker.setLatLng([lat, lng]);
    this.selectedLatLng = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
  }

  // If Leaflet not installed, dynamically load CSS+JS from CDN
  private loadLeafletFromCDN(): Promise<void> {
    return new Promise((resolve, reject) => {
      // CSS
      if (!document.querySelector('link[data-leaflet-cdn]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.setAttribute('data-leaflet-cdn', '1');
        document.head.appendChild(link);
      }
      // JS
      if ((window as any).L) return resolve();
      if (document.querySelector('script[data-leaflet-cdn]')) {
        // already loading
        const check = () => (window as any).L ? resolve() : setTimeout(check, 50);
        return check();
      }
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.async = true;
      s.setAttribute('data-leaflet-cdn', '1');
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Leaflet from CDN'));
      document.body.appendChild(s);
    });
  }

  // cleanup
  ngOnDestroy(): void {
    try {
      if (this.map) {
        this.map.off();
        this.map.remove();
        this.map = null;
      }
    } catch (e) {
      // ignore
    }
  }

  // File change handler
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileName = file.name;
      
      // Set file value to form control (registrationDocument)
      this.form.get('registrationDocument')?.setValue(file);

      // Mark file control as touched and update its validity
      this.form.get('registrationDocument')?.markAsTouched();
      this.form.get('registrationDocument')?.updateValueAndValidity();

      // Create file preview (only if it's an image)
      // Read a Data URL for persistence so file can be restored after refresh
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Store file and its DataURL/metadata in the flow service
        const existing = this.flow.getCompanyForm() || {};
        existing.file = file;
        existing.fileDataUrl = dataUrl;
        existing.fileName = file.name;
        existing.fileType = file.type;
        this.flow.setCompanyForm(existing);

        // Save compressed file into IndexedDB (async, don't block UI)
        this.flow.saveCompanyFile(file).catch(e => console.warn('saveCompanyFile failed', e));

        // Create preview if it's an image
        if (file.type.startsWith('image/')) {
          this.filePreview = dataUrl;
        } else {
          this.filePreview = null;
        }
      };
      reader.readAsDataURL(file);
    } else {
      this.fileName = '';
      this.form.get('registrationDocument')?.setValue(null);
      // Clear the native file input's value (allowed only to set empty string)
      try {
        (input as HTMLInputElement).value = '';
      } catch (e) {
        // ignore; browsers may throw in some environments
      }
      this.form.get('registrationDocument')?.updateValueAndValidity();
      this.filePreview = null;
    }
  }

  // Form submit handler
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Mark all form controls as touched to trigger validation
      return;
    }

    // Save step1 data locally and navigate to step2 without calling backend yet
    this.loading = true;
    this.error = null;

    const companyData: any = {
      name: (this.form.get('name')?.value || '').toString(),
      companyPerson: (this.form.get('companyPerson')?.value || '').toString().trim(),
      mobilePhone: this.form.get('mobilePhone')?.value || '',
      landLinePhone: this.form.get('landLinePhone')?.value || '',
      companyType: this.form.get('companyType')?.value || '',
      address: this.form.get('address')?.value || '',
      googleMapLocation: this.form.get('googleMapLocation')?.value || '',
    };

    const file: File | null = this.form.get('registrationDocument')?.value || null;
    if (file) {
      companyData.registrationDocument = file; // keep the File object in memory
      this.fileName = file.name;
    }

    // Persist company data via FormDataService
    this.formDataService.saveCompanyData(companyData);

    // Also persist in the flow service for backward compatibility
    this.flow.setCompanyForm(companyData);

    // Update registration flow state for next step
    this.registrationFlowService.setStep(2);
    this.registrationFlowService.setFormData(companyData);

    // Small UX pause so button shows loading state briefly
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/signup']);
    }, 200);
  }

  // convenience getters for template validation checks
  get name() {
    return this.form.get('name');
  }

  get companyPerson() {
    return this.form.get('companyPerson');
  }

  get mobilePhone() {
    return this.form.get('mobilePhone');
  }

  get landLinePhone() {
    return this.form.get('landLinePhone');
  }

  get registrationDocument() {
    return this.form.get('registrationDocument');
  }

  get companyType() {
    return this.form.get('companyType');
  }

  get address() {
    return this.form.get('address');
  }

  get googleMapLocation() {
    return this.form.get('googleMapLocation');
  }
}
