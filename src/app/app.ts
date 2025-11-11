import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LoginRegister } from "./login-register/login-register";
import { CommonModule } from '@angular/common';
import { Header } from "./header/header";
import { Localstorage } from './services/localstorage';
import { filter } from 'rxjs';
import { Notification } from './services/notification';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginRegister, CommonModule, Header],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'SN-Chat-app';
  isLoggedIn: boolean = false;
  constructor(private localservice: Localstorage, private router: Router, private notificationService: Notification) { }

  async ngOnInit() {
    // 🔹 Initial check
    this.isLoggedIn = !!this.localservice.getItem('user-UID');

    // 🔹 Reactively update when route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Check again after navigation
      this.isLoggedIn = !!this.localservice.getItem('user-UID');
    });

    const userUID = this.localservice.getItem('user-UID');
    if (userUID) {
      await this.notificationService.initializeNotificationListener();
    }
  }
  ngOnDestroy() {
    this.notificationService.destroyNotificationListener();
  }
}
