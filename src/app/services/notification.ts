// import { inject, Injectable } from '@angular/core';
// import { Localstorage } from './localstorage';
// import { UserService } from './user';
// import { doc, Firestore, getDoc, onSnapshot } from '@angular/fire/firestore';
// import { LocalNotifications } from '@capacitor/local-notifications';

// @Injectable({
//   providedIn: 'root'
// })
// export class Notification {
//   private firestore = inject(Firestore);
//   private localStorage = inject(Localstorage);
//   private userService = inject(UserService);

//   private notificationListener: any;
//   private isInitialized = false;

//   async initializeNotificationListener() {
//     if (this.isInitialized) return;

//     // Request notification permissions
//     const perm = await LocalNotifications.requestPermissions();
//     if (perm.display !== 'granted') {
//       console.log('Notification permission not granted');
//       return;
//     }

//     const currentUserUID = this.localStorage.getItem('user-UID');
//     if (!currentUserUID) {
//       console.log('No user UID found, skipping notification setup');
//       return;
//     }

//     // Listen to real-time updates on user document
//     const userDocRef = doc(this.firestore, `users/${currentUserUID}`);

//     this.notificationListener = onSnapshot(userDocRef, async (docSnapshot) => {
//       if (docSnapshot.exists()) {
//         const userData = docSnapshot.data();
//         await this.checkForNewMessages(userData);
//       }
//     });

//     this.isInitialized = true;
//     console.log('🔔 Global notification listener initialized');
//   }

//   private async checkForNewMessages(userData: any) {
//     if (!userData.allChatList || !Array.isArray(userData.allChatList)) return;

//     // Get previous state from localStorage using the new getObject method
//     const previousChatList = this.localStorage.getObject<any[]>('previous-chat-list') || [];

//     // Check each chat for new messages
//     for (const chat of userData.allChatList) {
//       await this.checkChatForNewMessages(chat, previousChatList);
//     }

//     // Update localStorage with current state
//     this.localStorage.setItem('previous-chat-list', userData.allChatList);
//   }

//   private async checkChatForNewMessages(chat: any, previousChatList: any[]) {
//     try {
//       // Safely find previous chat
//       const previousChat = previousChatList.find((prev: any) =>
//         prev && prev.partnerUID === chat.partnerUID
//       );

//       // Check if there's a new message from partner
//       if (this.isNewMessageFromPartner(chat, previousChat)) {
//         await this.showMessageNotification(chat.partnerName, chat.lastMeassage.text);
//       }
//     } catch (error) {
//       console.error('Error checking chat for new messages:', error);
//     }
//   }

//   private isNewMessageFromPartner(chat: any, previousChat: any): boolean {
//     // If no previous chat exists and current chat has a message from partner
//     if (!previousChat && chat.lastMeassage && chat.lastMeassage.type === 'other') {
//       return true;
//     }

//     // If both chats have messages, compare timestamps
//     if (previousChat &&
//       chat.lastMeassage &&
//       previousChat.lastMeassage &&
//       chat.lastMeassage.type === 'other') {

//       const previousLastMessageTime = new Date(previousChat.lastMeassage.time).getTime();
//       const currentLastMessageTime = new Date(chat.lastMeassage.time).getTime();

//       return currentLastMessageTime > previousLastMessageTime;
//     }

//     return false;
//   }

//   private async showMessageNotification(senderName: string, message: string) {
//     try {
//       await LocalNotifications.schedule({
//         notifications: [
//           {
//             title: `New message from ${senderName}`,
//             body: message.length > 50 ? message.substring(0, 50) + '...' : message,
//             id: Math.floor(Math.random() * 100000),
//             schedule: { at: new Date(Date.now() + 1000) }
//           }
//         ]
//       });
//       console.log('📱 Notification shown for message from:', senderName);
//     } catch (error) {
//       console.error('Error showing notification:', error);
//     }
//   }

//   destroyNotificationListener() {
//     if (this.notificationListener) {
//       this.notificationListener();
//       this.isInitialized = false;
//       console.log('🔔 Global notification listener destroyed');
//     }
//   }
// }




import { inject, Injectable } from '@angular/core';
import { Localstorage } from './localstorage';
import { UserService } from './user';
import { doc, Firestore, getDoc, onSnapshot, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BehaviorSubject } from 'rxjs';

// Notification data interface
export interface NotificationData {
  id: string;
  type: 'message' | 'system' | 'friend_request' | 'other';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private firestore = inject(Firestore);
  private localStorage = inject(Localstorage);
  private userService = inject(UserService);

  private notificationListener: any;
  private isInitialized = false;

  // BehaviorSubject for notifications
  private notificationsSubject = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  async initializeNotificationListener(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const permissionData = await LocalNotifications.requestPermissions();
      if (permissionData.display !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      const currentUserUID = this.localStorage.getItem('user-UID') as string;
      if (!currentUserUID) {
        console.log('No user UID found, skipping notification setup');
        return;
      }

      // Load existing notifications
      this.loadStoredNotifications();

      // Set up real-time listener
      const userDocRef = doc(this.firestore, `users/${currentUserUID}`);
      
      this.notificationListener = onSnapshot(userDocRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          await this.processUserUpdates(userData, currentUserUID);
        }
      });

      this.isInitialized = true;
      console.log('🔔 Global notification listener initialized');
    } catch (error) {
      console.error('Error initializing notification listener:', error);
    }
  }

  private async processUserUpdates(userData: any, currentUserUID: string): Promise<void> {
    const processData = {
      userData,
      currentUserUID,
      previousChatList: this.localStorage.getObject<any[]>('previous-chat-list') || []
    };

    // Only process message notifications from user data updates
    await this.processMessageNotifications(processData);
    
    // Update localStorage with current chat list
    if (userData.allChatList) {
      this.localStorage.setItem('previous-chat-list', userData.allChatList);
    }

    // Check for system notifications or other types that might be in user data
    await this.checkForSystemNotifications(userData);
  }

  private async processMessageNotifications(processData: { userData: any; currentUserUID: string; previousChatList: any[] }): Promise<void> {
    const { userData, currentUserUID, previousChatList } = processData;

    if (!userData.allChatList || !Array.isArray(userData.allChatList)) return;

    for (const chat of userData.allChatList) {
      const chatCheckData = {
        currentChat: chat,
        previousChat: previousChatList.find((prev: any) => prev && prev.partnerUID === chat.partnerUID),
        currentUserUID: currentUserUID
      };

      if (this.shouldNotifyNewMessage(chatCheckData)) {
        await this.createMessageNotification(chat);
      }
    }
  }

  private shouldNotifyNewMessage(chatData: { currentChat: any; previousChat: any; currentUserUID: string }): boolean {
    const { currentChat, previousChat, currentUserUID } = chatData;

    if (!currentChat.lastMeassage) return false;

    // Check if the message is from the partner (not from current user)
    const isMessageFromPartner = this.isMessageFromPartner(currentChat.lastMeassage, currentUserUID);
    
    if (!isMessageFromPartner) {
      return false; // Don't notify for messages sent by current user
    }

    // New chat with message from partner
    if (!previousChat && currentChat.lastMeassage) {
      return true;
    }

    // Existing chat with new message from partner
    if (previousChat && previousChat.lastMeassage) {
      const previousTime = new Date(previousChat.lastMeassage.time).getTime();
      const currentTime = new Date(currentChat.lastMeassage.time).getTime();
      
      return currentTime > previousTime;
    }

    return false;
  }

  private isMessageFromPartner(lastMessage: any, currentUserUID: string): boolean {
    // Method 1: Check by sender UID (if available)
    if (lastMessage.senderUID) {
      return lastMessage.senderUID !== currentUserUID;
    }

    // Method 2: Check by message type
    if (lastMessage.type === 'other' || lastMessage.type === 'received') {
      return true;
    }

    if (lastMessage.type === 'sent' || lastMessage.type === 'me') {
      return false;
    }

    // Method 3: Check by message content or other indicators
    // Add any additional logic based on your chat structure
    
    // Default: assume it's from partner if we can't determine
    console.warn('Could not determine message sender, defaulting to partner');
    return true;
  }

  private async createMessageNotification(chat: any): Promise<void> {
    const notificationData: NotificationData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'message',
      title: `New message from ${chat.partnerName}`,
      body: chat.lastMeassage.text.length > 50 
        ? chat.lastMeassage.text.substring(0, 50) + '...' 
        : chat.lastMeassage.text,
      timestamp: new Date().toISOString(),
      read: false,
      metadata: {
        partnerUID: chat.partnerUID,
        partnerName: chat.partnerName,
        chatId: chat.chatId
      }
    };

    await this.showLocalNotification(notificationData);
    await this.storeNotification(notificationData);
  }

  // Keep all other methods the same as in your previous code
  private async checkForSystemNotifications(userData: any): Promise<void> {
    // Check for system-level notifications in user data
    // For example: friend requests, system messages, etc.
    
    if (userData.pendingFriendRequests && userData.pendingFriendRequests.length > 0) {
      await this.processFriendRequestNotifications(userData.pendingFriendRequests);
    }

    if (userData.systemMessages && userData.systemMessages.length > 0) {
      await this.processSystemMessageNotifications(userData.systemMessages);
    }
  }

  private async processFriendRequestNotifications(friendRequests: any[]): Promise<void> {
    const previousRequests = this.localStorage.getObject<any[]>('previous-friend-requests') || [];
    
    for (const request of friendRequests) {
      const isNewRequest = !previousRequests.some(prev => 
        prev.requestId === request.requestId || 
        prev.fromUserId === request.fromUserId
      );

      if (isNewRequest) {
        await this.createNonMessageNotification({
          type: 'friend_request',
          title: 'Friend Request',
          body: `${request.fromUserName} sent you a friend request`,
          metadata: {
            requestId: request.requestId,
            fromUserId: request.fromUserId,
            fromUserName: request.fromUserName
          }
        });
      }
    }

    // Update stored friend requests
    this.localStorage.setItem('previous-friend-requests', friendRequests);
  }

  private async processSystemMessageNotifications(systemMessages: any[]): Promise<void> {
    const previousMessages = this.localStorage.getObject<any[]>('previous-system-messages') || [];
    
    for (const message of systemMessages) {
      const isNewMessage = !previousMessages.some(prev => 
        prev.messageId === message.messageId
      );

      if (isNewMessage) {
        await this.createNonMessageNotification({
          type: 'system',
          title: message.title || 'System Message',
          body: message.body,
          metadata: {
            messageId: message.messageId,
            priority: message.priority || 'normal'
          }
        });
      }
    }

    // Update stored system messages
    this.localStorage.setItem('previous-system-messages', systemMessages);
  }

  // Public method to create non-message notifications
  async createNonMessageNotification(notificationConfig: {
    type: 'system' | 'friend_request' | 'other';
    title: string;
    body: string;
    metadata?: { [key: string]: any };
  }): Promise<void> {
    const notificationData: NotificationData = {
      id: `${notificationConfig.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notificationConfig.type,
      title: notificationConfig.title,
      body: notificationConfig.body,
      timestamp: new Date().toISOString(),
      read: false,
      metadata: notificationConfig.metadata
    };

    await this.showLocalNotification(notificationData);
    await this.storeNotification(notificationData);
    
    // Also store in Firestore for persistence
    await this.storeNotificationInFirestore(notificationData);
  }

  private async showLocalNotification(notificationData: NotificationData): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notificationData.title,
            body: notificationData.body,
            id: this.generateNotificationId(),
            schedule: { at: new Date(Date.now() + 1000) },
            extra: notificationData
          }
        ]
      });
      console.log(`📱 ${notificationData.type} notification shown:`, notificationData.title);
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  private async storeNotification(notificationData: NotificationData): Promise<void> {
    const currentNotifications = this.getStoredNotifications();
    const updatedNotifications = [notificationData, ...currentNotifications].slice(0, 100); // Keep last 100
    
    this.localStorage.setItem('app-notifications', updatedNotifications);
    this.notificationsSubject.next(updatedNotifications);
  }

  private async storeNotificationInFirestore(notificationData: NotificationData): Promise<void> {
    try {
      const currentUserUID = this.localStorage.getItem('user-UID');
      if (!currentUserUID) return;

      const userDocRef = doc(this.firestore, `users/${currentUserUID}`);
      await updateDoc(userDocRef, {
        notifications: arrayUnion(notificationData)
      });
    } catch (error) {
      console.error('Error storing notification in Firestore:', error);
    }
  }

  // Load notifications from localStorage
  private loadStoredNotifications(): void {
    const storedNotifications = this.localStorage.getObject<NotificationData[]>('app-notifications') || [];
    this.notificationsSubject.next(storedNotifications);
  }

  // Public method to get stored notifications
  getStoredNotifications(): NotificationData[] {
    return this.localStorage.getObject<NotificationData[]>('app-notifications') || [];
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notifications = this.getStoredNotifications();
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    );
    
    this.localStorage.setItem('app-notifications', updatedNotifications);
    this.notificationsSubject.next(updatedNotifications);
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.localStorage.setItem('app-notifications', []);
    this.notificationsSubject.next([]);
  }

  // Get notifications by type
  getNotificationsByType(type: NotificationData['type']): NotificationData[] {
    const notifications = this.getStoredNotifications();
    return notifications.filter(notification => notification.type === type);
  }

  // Get unread count
  getUnreadCount(): number {
    const notifications = this.getStoredNotifications();
    return notifications.filter(notification => !notification.read).length;
  }

  private generateNotificationId(): number {
    return Math.floor(Math.random() * 1000000);
  }

  // Helper method to get notification icon
  getNotificationIcon(type: NotificationData['type']): string {
    const icons = {
      message: '💬',
      system: '⚙️',
      friend_request: '👤',
      other: '🔔'
    };
    return icons[type] || '🔔';
  }

  destroyNotificationListener(): void {
    if (this.notificationListener) {
      this.notificationListener();
      this.isInitialized = false;
      console.log('🔔 Global notification listener destroyed');
    }
  }
}