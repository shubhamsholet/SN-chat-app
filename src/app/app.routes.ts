import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'home',
        loadComponent: () => import('../app/home-page/home-page').then(c => c.HomePage)
    },
    {
        path: 'notification',
        loadComponent: () => import('../app/notification-shell/notification-shell').then(c => c.NotificationShell)
    },
    {
        path: 'chatting',
        loadComponent: () => import('../app/chat/chatting-templete/chatting-templete').then(c => c.ChattingTemplete)
    },
    {
        path: '',
        loadComponent: () => import('../app/login-register/login-register').then(c => c.LoginRegister)
    },
    {
        path: '**',
        loadComponent: () => import('../app/login-register/login-register').then(c => c.LoginRegister)
    }
];
