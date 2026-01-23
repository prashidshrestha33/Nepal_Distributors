import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../../../services/management/company.service';
import type { company, Category,ApproveCompanyRequest } from '../../../../services/management/company.service';
import { environment } from '../../../../../../environments/environment';
import { LightboxModule, Lightbox } from 'ngx-lightbox';
import { SafeHtmlPipe } from '../../../../pipe/safe-html.pipe';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, FormsModule, LightboxModule, SafeHtmlPipe, NgSelectModule],
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit {
  company: company[] = [];
  filteredCompany: company[] = [];
  searchTerm: string = '';
  loading = false;
  error: string | null = null;

  categories: Category[] = [];
  nestedCategories: Category[] = []; // flattened for ng-select
  selectedCategoryIds: number[] = [];

  showApproveModal = false;
  isreject = true;
  rejectReason: string = '';
  showApproveModal1 = false;
  selectedCompanyId: number | null = null;

  companylst: company = {
    id: undefined,
    name: '',
    email: '',
    mobilePhone: '',
    contactPerson: '',
    landlinePhone: '',
    registrationDocument: '',
    companyType: '',
    status: '',
    userType: '',
    credits: 0,
    location: '',
    googleMapLocation: '',
    createdAt: undefined
  };

  constructor(private CompanyService: CompanyService, private lightbox: Lightbox) {}

  ngOnInit() {
    this.loadCompanys();
    this.loadCategories();
  }

  // ===================== LOAD CATEGORIES =====================
loadCategories() {
  this.loading = true;
  this.CompanyService.getCategories().subscribe({
    next: (res: any) => { // API wrapper
      debugger;
      this.categories = res || [];

      // Flatten for ng-select
      this.nestedCategories = this.flattenCategories(this.categories);

      this.loading = false;
      console.log('Nested Categories:', this.nestedCategories);
    },
    error: (err) => {
      console.error('Failed to load categories:', err);
      this.error = 'Failed to load categories. Please try again.';
      this.loading = false;
    }
  });
}


flattenCategories(categories: Category[], depth = 0): Category[] {
  const result: Category[] = [];

  for (const cat of categories) {
    result.push({ ...cat, depth });
    if (cat.children && cat.children.length > 0) {
      result.push(...this.flattenCategories(cat.children, depth + 1));
    }
  }

  return result;
}

  // ===================== CATEGORY SELECTION =====================
  toggleSelection(categoryId: number) {
    const idx = this.selectedCategoryIds.indexOf(categoryId);
    if (idx > -1) this.selectedCategoryIds.splice(idx, 1);
    else this.selectedCategoryIds.push(categoryId);
  }

  isSelected(categoryId: number): boolean {
    return this.selectedCategoryIds.includes(categoryId);
  }

  // ===================== FILE HELPERS =====================
  isImage(fileUrl?: string): boolean {
    return !!fileUrl && /\.(jpeg|jpg|gif|png|bmp|webp)$/i.test(fileUrl);
  }

  isPDF(fileUrl?: string): boolean {
    return !!fileUrl && /\.pdf$/i.test(fileUrl);
  }

  getFileUrl(fileName?: string): string {
    if (!fileName) return '';
    fileName = fileName.replace(/^\/+/, '');
    return `${environment.apiBaseUrl}/api/CompanyFile/${fileName}`;
  }

  openImage(fileName?: string): void {
    if (!fileName) return;
    const src = this.getFileUrl(fileName);
    if (!src) return;

    const album = [{ src, caption: 'Company Document', thumb: src }];
    this.lightbox.open(album, 0);
  }

  // ===================== COMPANY MODAL =====================
  openApproveModal(id: number) {
    this.CompanyService.getCompanyById(id).subscribe({
      next: (data: company) => {
        this.companylst = data;
        this.selectedCompanyId = id;
        this.showApproveModal = true;
      },
      error: (err) => {
        console.error('Failed to load Company:', err);
        this.error = 'Failed to load Company. Please try again.';
      }
    });
  }
openApprovestep1Modal(fg: string){
  debugger;
        this.isreject=fg=="a"?false:true;
        this.showApproveModal = false;
        this.showApproveModal1 = true;
}
  closeApproveModal() {
    this.showApproveModal = false;
        this.showApproveModal1 = false;
    this.selectedCompanyId = null;
  }

  confirmApprove() {
    if (!this.selectedCompanyId) return;


   const approveCompanyRequest: ApproveCompanyRequest = {
    companyId: this.selectedCompanyId,
    assignCategory: this.isreject
      ? ''
      : this.selectedCategoryIds.join(','), 
    rejectComment: this.isreject ? this.rejectReason : "",
    approveFg: this.isreject?'N':'Y'
  };
  debugger;
    this.CompanyService.ApproveCompany(approveCompanyRequest).subscribe({
      next: () => {
        this.closeApproveModal();
        this.loadCompanys();
      },
      error: (err) => {
        console.error('Failed to approve Company:', err);
        this.error = 'Failed to approve Company. Please try again.';
        this.closeApproveModal();
      }
    });
  }

  // ===================== LOAD & SEARCH =====================
  loadCompanys() {
    this.loading = true;
    this.CompanyService.getCompanys().subscribe({
      next: (data: company[]) => {
        this.company = data;
        this.filteredCompany = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load Companys:', err);
        this.error = 'Failed to load Companys. Please try again.';
        this.loading = false;
      }
    });
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase();
    this.filteredCompany = this.company.filter(c =>
      (c.name?.toLowerCase().includes(term) ?? false) ||
      (c.email?.toLowerCase().includes(term) ?? false) ||
      (c.mobilePhone?.toLowerCase().includes(term) ?? false)
    );
  }

  // ===================== GOOGLE MAP =====================
  getGoogleMapUrl(point?: string): string | null {
    if (!point) return null;
    const match = point.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (!match) return null;
    const lng = match[1];
    const lat = match[2];
    return `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
  }

  // ===================== DELETE =====================
  deleteCompany(id: number) {
    if (!confirm('Are you sure you want to delete this Company?')) return;
    this.CompanyService.deleteCompany(id).subscribe({
      next: () => this.loadCompanys(),
      error: (err) => {
        console.error('Failed to delete Company:', err);
        this.error = 'Failed to delete Company. Please try again.';
      }
    });
  }
}
