import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiService } from '../../../../ui.service';
import { company, CompanyService,StaticValue  } from '../../../services/management/company.service';
import { NgSelectModule } from '@ng-select/ng-select';
@Component({
  selector: 'app-RegisterUserlink-popup',
  standalone: true,
  imports: [CommonModule, FormsModule,NgSelectModule],
  templateUrl: './RegisterUserlink-popup.component.html',
  styleUrls: ['./RegisterUserlink-popup.component.css']
})
export class RegisterUserlinkPopupComponent implements OnInit {

  @Input() companyId!: number;
  @Output() close = new EventEmitter<void>();

  company?: company;
  editMode = false;
  loading = true;
  uploading = false;
    StaticValue: StaticValue[] = [];
    selectedStaticValueId: string = '';
  RegisterEmailID: string = '';

  errorModal2: string | null = null;
  constructor(
    private CompanyService: CompanyService,
    private ui: UiService
  ) {}

  ngOnInit(): void {
    if (this.companyId) {
    this.getStaticValuesrole();
    }
  }
  getStaticValuesrole(){
  debugger;
      this.CompanyService.getStaticValuesrole().subscribe({
       next: (res: any) => { // API wrapper
      debugger;
      this.StaticValue = res || [];
      },
      error: (err) => {
      }
    });
}


RegisterNewUserLink() {
  const role = this.selectedStaticValueId;
  const email = this.RegisterEmailID;
  const companyId = this.companyId;
debugger;
  if (!role || !email || !companyId) {
    this.errorModal2 = "Please enter all required fields"; 
    return;
  }

  this.CompanyService.sendRegisterLink(email, role, companyId.toString()).subscribe({
    next: (response) => {
      console.log('Registration link sent successfully:', response);
      this.closePopup();
        this.ui.showStatus('Registration link sent successfully!', 'success');
    },
    error: (err) => {
      console.error('Failed to send registration link:', err);
      this.errorModal2 = 'Failed to send registration link. Please try again.';
    }
  });
}
  cancelEdit(): void {
    this.editMode = false;
  }

  closePopup(): void {
    this.close.emit();
  }
}
