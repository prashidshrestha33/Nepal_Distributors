import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaticValueService } from '../../../../services/management/management.service';
import type { StaticValue } from '../../../../services/management/management.service';

@Component({
  selector: 'app-static-values',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './static-values.component.html',
  styleUrl: './static-values.component.css'
})
export class StaticValuesComponent implements OnInit {
  items: StaticValue[] = [];
  filteredItems: StaticValue[] = [];
  searchTerm = '';

  constructor(private service: StaticValueService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getStaticValues().subscribe((data: StaticValue[]) => {
      this.items = data;
      this.filteredItems = data;
    });
  }

  onSearch() {
    this.filteredItems = this.items.filter(i =>
      i.key.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  delete(id: number) {
    if (confirm('Are you sure?')) {
      this.service.deleteStaticValue(id).subscribe(() => this.load());
    }
  }
}
