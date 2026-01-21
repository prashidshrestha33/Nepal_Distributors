import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StaticValueService } from '../../../../services/management/management.service';
import type { StaticValue ,StaticValueCatalog} from '../../../../services/management/management.service';

@Component({
  selector: 'app-static-values',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './static-values-catalog.component.html',
  
  styleUrl: './static-values-catalog.component.css'
})
export class StaticValuesCatalogComponent implements OnInit {
  items: StaticValueCatalog[] = [];
  filteredItems: StaticValueCatalog[] = [];
  searchTerm = '';

  constructor(private service: StaticValueService,private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getStaticValuesCatagory().subscribe((data: StaticValueCatalog[]) => {
      this.items = data;
      this.filteredItems = data;
    });
  }
  viewStaticValues(catalogId: number): void {
    console.log('Navigating to static values for catalog:', catalogId);
    this.router.navigate(['/management/static-values'], {
      queryParams: { catalogId:  catalogId }
    });
  }
  onSearch() {
    this.filteredItems = this.items.filter(i =>
      i.catalogName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  delete(id: number) {
    if (confirm('Are you sure?')) {
      this.service.deleteStaticValue(id).subscribe(() => this.load());
    }
  }
}
