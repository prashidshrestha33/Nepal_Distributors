import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';

import { BreadcrumbService } from '../app/shared/services/breadcrumb.service';
import { NavigationHistoryService } from '../app/shared/services/navigation-history.service';

import { routes } from './app.routes';
import { JwtInterceptor } from './shared/interceptors/jwt.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),

    // ✅ JWT interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },

    // ✅ Firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideMessaging(() => getMessaging()),

    // ✅ ADD THESE TWO SERVICES
    BreadcrumbService,
    NavigationHistoryService
  ]
};
