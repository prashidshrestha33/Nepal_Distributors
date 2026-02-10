import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UiService } from '../../../../ui.service';
import { CompanyService, company } from '../../../services/management/company.service';
import { SafeHtmlPipe } from '../../../../shared/pipe/safe-html.pipe';

@Component({
  selector: 'app-company-profile-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe],
  templateUrl: './company-profile-popup.component.html',
  styleUrls: ['./company-profile-popup.component.css']
})
export class CompanyProfilePopupComponent implements OnInit, OnDestroy {

  @Input() companyId!: number;
  @Output() close = new EventEmitter<void>();

  company?: company;
  editMode = false;
  loading = true;
  uploading = false;
  selectedFile?: File;
  filePreview?: string;

  @ViewChild('companyMapDiv') mapContainer!: ElementRef<HTMLDivElement>;
  private map: any;
  private marker: any;
  private leaflet: any;
  private mapInitialized = false;
  private newLatLng: { lat: number, lng: number } | null = null;

  constructor(
    private companyService: CompanyService,
    private ui: UiService,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (this.companyId) this.loadCompany();
  }

  loadCompany(): void {
    this.loading = true;
    this.companyService.getById(this.companyId).subscribe({
      next: res => {
        this.company = { ...res };
        this.loading = false;

        if (this.company.registrationDocument && this.isImage(this.company.registrationDocument)) {
          this.filePreview = this.getFileUrl(this.company.registrationDocument);
        }

      },
      error: () => {
        this.loading = false;
        this.ui.showStatus('Failed to load company profile', 'error');
      }
    });
  }

  enableEdit(): void {
    this.editMode = true;

    // Set initial coordinates
    if (this.company?.googleMapLocation) {
      const match = this.company.googleMapLocation.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
      if (match) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        this.newLatLng = { lat, lng };
      }
    }

    setTimeout(() => this.initLeaflet(), 0);
  }

  private async initLeaflet() {
    if (this.mapInitialized) return;

    try {
      const Lmod = await import('leaflet');
      this.leaflet = Lmod.default || Lmod;
    } catch {
      await this.loadLeafletFromCDN();
      // @ts-ignore
      this.leaflet = (window as any).L;
    }

    const L = this.leaflet;
    const container = this.mapContainer?.nativeElement;
    if (!container) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const DEFAULT = { lat: 27.7172, lng: 85.3240, zoom: 15 };
    const coords = this.newLatLng || { lat: DEFAULT.lat, lng: DEFAULT.lng };

    this.map = L.map(container, { center: [coords.lat, coords.lng], zoom: DEFAULT.zoom });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(this.map);
    this.newLatLng = coords;

    this.marker.on('dragend', () => {
      const p = this.marker.getLatLng();
      this.ngZone.run(() => this.newLatLng = { lat: p.lat, lng: p.lng });
    });

    this.map.on('click', (e: any) => this.moveMarker(e.latlng.lat, e.latlng.lng));

    setTimeout(() => { try { this.map.invalidateSize(); } catch {} }, 100);
    this.mapInitialized = true;
  }

  private moveMarker(lat: number, lng: number) {
    if (!this.marker) return;
    this.marker.setLatLng([lat, lng]);
    this.newLatLng = { lat, lng };
  }

  private loadLeafletFromCDN(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-leaflet-cdn]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.setAttribute('data-leaflet-cdn', '1');
        document.head.appendChild(link);
      }
      if ((window as any).L) return resolve();
      if (document.querySelector('script[data-leaflet-cdn]')) {
        const check = () => (window as any).L ? resolve() : setTimeout(check, 50);
        return check();
      }
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.async = true;
      s.setAttribute('data-leaflet-cdn', '1');
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Leaflet'));
      document.body.appendChild(s);
    });
  }

  cancelEdit() { this.editMode = false; this.loadCompany(); }

  save() {
    debugger;
    if (!this.company) return;

    if (this.newLatLng) {
      const { lng, lat } = this.newLatLng;
      this.company.googleMapLocation = `POINT(${lng} ${lat})`;
    }

    if (this.selectedFile) {
      this.uploading = true;
      this.companyService.uploadDocument(this.selectedFile, this.company!.id!).subscribe({
        next: res => {
          this.company!.registrationDocument = res.fileName;
          this.selectedFile = undefined;
          this.uploading = false;
          this.finalSave();
        },
        error: () => { this.uploading = false; this.ui.showStatus('File upload failed', 'error'); }
      });
    } else {
      this.finalSave();
    }
  }

  private finalSave() {
    if (!this.company) return;
    this.companyService.update(this.company).subscribe({
      next: () => { this.ui.showStatus('Company updated successfully', 'success'); this.editMode = false; this.loadCompany(); },
      error: () => this.ui.showStatus('Update failed', 'error')
    });
  }

  selectFile(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];

      if (this.selectedFile) {
        this.uploading = true;
        this.companyService.uploadDocument(this.selectedFile, this.company!.id!).subscribe({
          next: res => {
            if (res && res.fileName) {
              this.company!.registrationDocument = res.fileName;
              if (this.isImage(res.fileName)) this.filePreview = this.getFileUrl(res.fileName);
              else this.filePreview = undefined;
            }
            this.uploading = false;
          },
          error: () => { this.uploading = false; this.ui.showStatus('File upload failed', 'error'); }
        });
      }
    }
  }

  closePopup() { this.close.emit(); }

  isImage(file?: string) { return !!file && /\.(jpg|jpeg|png|gif)$/i.test(file); }
  isPDF(file?: string) { return !!file && /\.pdf$/i.test(file); }
  getFileUrl(file?: string) { return file ? `/uploads/${file}` : ''; }
// Open registration document in a new tab (image or PDF)
openImage(file?: string) {
  if (!file) return;
  const url = this.getFileUrl(file);
  window.open(url, '_blank');
}

  getGoogleMapUrl(point?: string): SafeResourceUrl | null {
    if (!point) return null;
    const match = point.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (!match) return null;
    const lng = match[1];
    const lat = match[2];
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.google.com/maps?q=${lat},${lng}&output=embed`);
  }

  ngOnDestroy() { try { if (this.map) { this.map.off(); this.map.remove(); } } catch {} }
}
