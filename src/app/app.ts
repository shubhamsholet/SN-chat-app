import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LoginRegister } from "./login-register/login-register";
import { CommonModule } from '@angular/common';
import { Header } from "./header/header";
import { Localstorage } from './services/localstorage';
import { filter, Subscription } from 'rxjs';
import { NotificationService } from './services/notification';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginRegister, CommonModule, Header],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected title = 'SN-Chat-app';
  isLoggedIn: boolean = false;
  private routerSubscription!: Subscription;

  constructor(
    private localservice: Localstorage, 
    private router: Router, 
    private notificationService: NotificationService
  ) { }

  async ngOnInit() {
    // 🔹 Initial check for authentication
    this.checkAuthentication();
    
    // 🔹 Initialize notifications if user is logged in
    await this.initializeForLoggedInUser();

    // 🔹 Reactively update when route changes
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkAuthentication();
    });
  }

  private checkAuthentication(): void {
    const userUID = this.localservice.getItem('user-UID');
    const wasLoggedIn = this.isLoggedIn;
    this.isLoggedIn = !!userUID;

    // If user was logged in but now is not, redirect to login
    if (wasLoggedIn && !this.isLoggedIn) {
      this.router.navigate(['/']);
    }
    
    // If user is logged in but on login page, redirect to home
    if (this.isLoggedIn && (this.router.url === '/' || this.router.url === '/login')) {
      this.router.navigate(['/home']);
    }
  }

  private async initializeForLoggedInUser(): Promise<void> {
    const userUID = this.localservice.getItem('user-UID');
    if (userUID) {
      try {
        await this.notificationService.initializeNotificationListener();
        console.log('✅ Notifications initialized for logged in user');
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    }
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    this.notificationService.destroyNotificationListener();
  }
}