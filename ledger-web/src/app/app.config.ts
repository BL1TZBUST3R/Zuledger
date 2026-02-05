import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // 👈 Import this!

import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor'; // 👈 Import your new file!

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    
    // 👇 This is the magic line that attaches the token!
    provideHttpClient(withInterceptors([authInterceptor])) 
  ]
};