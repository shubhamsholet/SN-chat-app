import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from "../header/header";
import { NotificationService, NotificationData } from '../services/notification';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-shell',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './notification-shell.html',
  styleUrl: './notification-shell.scss'
})
export class NotificationShell implements OnInit, OnDestroy {
  notifications: NotificationData[] = [];
  private notificationsSubscription!: Subscription;

  // Correct injection
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.initializeNotifications();
  }

  private initializeNotifications(): void {
    // Subscribe to notifications observable
    this.notificationsSubscription = this.notificationService.notifications$
      .subscribe(notifications => {
        this.notifications = notifications;
        console.log('Notifications updated:', notifications);
      });

    // Initialize the notification listener
    this.notificationService.initializeNotificationListener();
  }

  // Get non-message notifications for display
  get nonMessageNotifications(): NotificationData[] {
    return this.notifications.filter(notification => 
      notification.type !== 'message'
    );
  }

  // Mark notification as read
  markAsRead(notification: NotificationData): void {
    this.notificationService.markAsRead(notification.id);
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notificationService.clearAllNotifications();
  }

  // Get unread count for non-message notifications
  get unreadNonMessageCount(): number {
    return this.nonMessageNotifications.filter(notification => !notification.read).length;
  }

  // Format timestamp for display
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  // Get notification icon
  getNotificationIcon(type: NotificationData['type']): string {
    return this.notificationService.getNotificationIcon(type);
  }

  ngOnDestroy(): void {
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
    this.notificationService.destroyNotificationListener();
  }
}