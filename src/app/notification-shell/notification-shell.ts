// notification-shell.component.ts
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

  // Get all notifications sorted by timestamp (newest first)
  get sortedNotifications(): NotificationData[] {
    return this.notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get unread notifications
  get unreadNotifications(): NotificationData[] {
    return this.sortedNotifications.filter(notification => !notification.read);
  }

  // Get read notifications
  get readNotifications(): NotificationData[] {
    return this.sortedNotifications.filter(notification => notification.read);
  }

  // Mark notification as read
  markAsRead(notification: NotificationData): void {
    this.notificationService.markAsRead(notification.id);
  }

  // Mark all as read
  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notificationService.clearAllNotifications();
  }

  // Get unread count
  get unreadCount(): number {
    return this.unreadNotifications.length;
  }

  // Format timestamp for display
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }

  // Get notification icon
  getNotificationIcon(type: NotificationData['type']): string {
    return this.notificationService.getNotificationIcon(type);
  }

  // Get notification type display name
  getNotificationTypeDisplay(type: NotificationData['type']): string {
    const typeMap = {
      message: 'Message',
      system: 'System',
      friend_request: 'Friend Request',
      other: 'Notification'
    };
    return typeMap[type] || 'Notification';
  }

  ngOnDestroy(): void {
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
    this.notificationService.destroyNotificationListener();
  }
}