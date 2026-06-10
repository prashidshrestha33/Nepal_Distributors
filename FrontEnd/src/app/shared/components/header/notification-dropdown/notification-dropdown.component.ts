import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { NotificationService, ReceivedNotification } from '../../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent]
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  notifying = false;
  notifications: ReceivedNotification[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.notificationService.notifications$.subscribe(data => {
        this.notifications = data || [];
        this.notifying = this.notifications.some(n => !n.read);
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Mark all as read when opened, or keep them unread until clicked?
      // Keeping them unread until clicked or cleared is usually better for visibility,
      // but let's just toggle isOpen.
    }
  }

  closeDropdown() {
    this.isOpen = false;
  }

  onNotificationClick(item: ReceivedNotification) {
    this.notificationService.markAsRead(item.id);
    this.closeDropdown();

    if (item.type === 'order' && item.orderId) {
      this.router.navigate(['/management/orders/track', item.orderId]);
    } else {
      this.router.navigate(['/management/orders']);
    }
  }

  clearAll(event: MouseEvent) {
    event.stopPropagation();
    this.notificationService.clearAllStoredNotifications();
  }
}