import { inject, Injectable } from '@angular/core';
import { Localstorage } from './localstorage';
import { UserService } from './user';
import { doc, Firestore, getDoc, onSnapshot } from '@angular/fire/firestore';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class Notification {
  private firestore = inject(Firestore);
  private localStorage = inject(Localstorage);
  private userService = inject(UserService);

  private notificationListener: any;
  private isInitialized = false;

  async initializeNotificationListener() {
    if (this.isInitialized) return;

    // Request notification permissions
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const currentUserUID = this.localStorage.getItem('user-UID');
    if (!currentUserUID) {
      console.log('No user UID found, skipping notification setup');
      return;
    }

    // Listen to real-time updates on user document
    const userDocRef = doc(this.firestore, `users/${currentUserUID}`);

    this.notificationListener = onSnapshot(userDocRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        await this.checkForNewMessages(userData);
      }
    });

    this.isInitialized = true;
    console.log('🔔 Global notification listener initialized');
  }

  private async checkForNewMessages(userData: any) {
    if (!userData.allChatList || !Array.isArray(userData.allChatList)) return;

    // Get previous state from localStorage using the new getObject method
    const previousChatList = this.localStorage.getObject<any[]>('previous-chat-list') || [];

    // Check each chat for new messages
    for (const chat of userData.allChatList) {
      await this.checkChatForNewMessages(chat, previousChatList);
    }

    // Update localStorage with current state
    this.localStorage.setItem('previous-chat-list', userData.allChatList);
  }

  private async checkChatForNewMessages(chat: any, previousChatList: any[]) {
    try {
      // Safely find previous chat
      const previousChat = previousChatList.find((prev: any) =>
        prev && prev.partnerUID === chat.partnerUID
      );

      // Check if there's a new message from partner
      if (this.isNewMessageFromPartner(chat, previousChat)) {
        await this.showMessageNotification(chat.partnerName, chat.lastMeassage.text);
      }
    } catch (error) {
      console.error('Error checking chat for new messages:', error);
    }
  }

  private isNewMessageFromPartner(chat: any, previousChat: any): boolean {
    // If no previous chat exists and current chat has a message from partner
    if (!previousChat && chat.lastMeassage && chat.lastMeassage.type === 'other') {
      return true;
    }

    // If both chats have messages, compare timestamps
    if (previousChat &&
      chat.lastMeassage &&
      previousChat.lastMeassage &&
      chat.lastMeassage.type === 'other') {

      const previousLastMessageTime = new Date(previousChat.lastMeassage.time).getTime();
      const currentLastMessageTime = new Date(chat.lastMeassage.time).getTime();

      return currentLastMessageTime > previousLastMessageTime;
    }

    return false;
  }

  private async showMessageNotification(senderName: string, message: string) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `New message from ${senderName}`,
            body: message.length > 50 ? message.substring(0, 50) + '...' : message,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 1000) }
          }
        ]
      });
      console.log('📱 Notification shown for message from:', senderName);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  destroyNotificationListener() {
    if (this.notificationListener) {
      this.notificationListener();
      this.isInitialized = false;
      console.log('🔔 Global notification listener destroyed');
    }
  }
}
