import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationService } from '../../../../services/management/management.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-buyer-bids',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buyer-bids.component.html',
  styleUrls: ['./buyer-bids.component.css']
})
export class BuyerBidsComponent implements OnInit {
  activeTab: 'inbox' | 'history' = 'inbox';
  
  inbox: any[] = [];
  groupedInbox: any = {}; // We group by Product Name so the buyer can compare prices easily!
  groupedProducts: string[] = [];
  
  history: any[] = [];
  loading = true;

  buyerCompanyId = 2; // Assuming the logged in user is the buyer

  constructor(private mgtService: QuotationService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
       const tokenString  = localStorage.getItem('userClaims') || sessionStorage.getItem('userClaims');
    if(tokenString)
      {
             const token = JSON.parse(tokenString); 
             this.buyerCompanyId = +token.company_id;
             
      }
    this.loading = true;
    this.mgtService.getBuyerQuotations(this.buyerCompanyId).subscribe(res => {
      const data = res.data || res.result;
      
      if (data) {
        this.inbox = data.inbox || [];
        this.history = data.history || [];
        
        // Group the inbox explicitly by Product Name so buyers can compare rates perfectly!
        this.groupedInbox = this.inbox.reduce((group, quote) => {
          const productKey = quote.productName;
          if (!group[productKey]) group[productKey] = [];
          group[productKey].push(quote);
          return group;
        }, {});
        
        this.groupedProducts = Object.keys(this.groupedInbox);
      }
      this.loading = false;
    });
  }

  switchTab(tab: 'inbox' | 'history') {
    this.activeTab = tab;
  }

  getImageUrl(imageName: string): string {
    return imageName 
      ? `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(imageName)}`
      : 'assets/images/no-image.png';
  }

  // 💡 Placeholder for when we build the Jira Board logic next!
  approveQuote(quoteId: number) {
     this.mgtService.approveQuote(quoteId,this.buyerCompanyId).subscribe({
        next: () => {
           this.loadDashboard(); 
        },
        error: (err) => {
          console.error('Error creating quotation:', err);
          this.loading = false;
        }
      });
     alert(`Feature coming next: Confirming quote ${quoteId} to turn it into a Purchase Order for your Jira board!`);
  }
  rejectQuote(quoteId: number) {
      this.mgtService.rejectQuote(quoteId).subscribe({
        next: () => {
           this.loadDashboard(); 
        },
        error: (err) => {
          console.error('Error creating quotation:', err);
          this.loading = false;
        }
      });
  }
}
