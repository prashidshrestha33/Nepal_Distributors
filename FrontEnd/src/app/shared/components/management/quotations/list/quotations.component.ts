import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotationService } from '../../../../services/management/management.service';
import type { Quotation } from '../../../../services/management/management.service';

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotations.component.html',
  styleUrl: './quotations.component.css'
})
export class QuotationsComponent implements OnInit {
  items: Quotation[] = [];
  filteredItems: Quotation[] = [];
  searchTerm = '';

  constructor(private service: QuotationService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getQuotations().subscribe((data: Quotation[]) => {
      this.items = data;
      this.filteredItems = data;
    });
  }

  onSearch() {
    this.filteredItems = this.items.filter(i =>
      i.quotationNumber.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  approve(id: number) {
    this.service.approveQuotation(id).subscribe(() => this.load());
  }

  delete(id: number) {
    if (confirm('Are you sure?')) {
      this.service.deleteQuotation(id).subscribe(() => this.load());
    }
  }
}
