import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../services/management/management.service';
import type { Notification } from '../../../../services/management/management.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
  items: Notification[] = [];
  filteredItems: Notification[] = [];
  searchTerm = '';

  constructor(private service: NotificationService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getNotifications().subscribe((data: Notification[]) => {
      this.items = data;
      this.filteredItems = data;
    });
  }

  onSearch() {
    this.filteredItems = this.items.filter(i =>
      i.message.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  markAsRead(id: number) {
    this.service.markAsRead(id).subscribe(() => this.load());
  }

  delete(id: number) {
    if (confirm('Are you sure?')) {
      this.service.deleteNotification(id).subscribe(() => this.load());
    }
  }
}
