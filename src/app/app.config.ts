// import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, importProvidersFrom  } from '@angular/core';
// import { provideRouter } from '@angular/router';

// import { routes } from './app.routes';
// // Firebase + AngularFire imports
// import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
// import { provideAuth, getAuth } from '@angular/fire/auth';
// import { provideFirestore, getFirestore } from '@angular/fire/firestore';
// import { provideStorage, getStorage } from '@angular/fire/storage';

// import { firebaseConfig } from '../app/environment.firebase';
// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideBrowserGlobalErrorListeners(),
//     provideZonelessChangeDetection(),
//     provideRouter(routes),
//     importProvidersFrom(provideFirebaseApp(() => initializeApp(firebaseConfig))),
//     importProvidersFrom(provideAuth(() => getAuth())),
//     importProvidersFrom(provideFirestore(() => getFirestore())),
//     importProvidersFrom(provideStorage(() => getStorage()))
//   ]
// };


import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners, provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';

// Firebase + AngularFire
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { firebaseConfig } from '../app/environment.firebase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // Router
    provideRouter(routes), 

    // HttpClient global
    provideHttpClient(withInterceptorsFromDi()),

    // Firebase App
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ]
};
