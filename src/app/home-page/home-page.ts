import { Component, OnInit } from '@angular/core';
import { Header } from "../header/header";
import { ChatHome } from "../chat/chat-home/chat-home";
import { Notification } from '../services/notification';
import { Localstorage } from '../services/localstorage';

@Component({
  selector: 'app-home-page',
  imports: [Header, ChatHome],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {

  constructor(
     private notificationService: Notification,
    private localStorage: Localstorage
  ) { }

    async ngOnInit() {
    // Double-check notification service is initialized
    const userUID = this.localStorage.getItem('user-UID');
    if (userUID) {
      await this.notificationService.initializeNotificationListener();
    }
  }
}
