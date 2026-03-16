import { NgModule, ModuleWithProviders } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { SpringAuthConfig } from './models/auth.models';
import { SPRING_AUTH_CONFIG } from './models/auth.tokens';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

/**
 * NgModule entry point — use for class-module-based Angular apps.
 *
 * @example
 * // app.module.ts
 * imports: [
 *   SpringAuthModule.forRoot({ apiUrl: 'http://localhost:8080/api' })
 * ]
 */
@NgModule({
  imports: [LoginComponent, RegisterComponent, RouterModule],
  exports: [LoginComponent, RegisterComponent],
})
export class SpringAuthModule {
  static forRoot(config: SpringAuthConfig): ModuleWithProviders<SpringAuthModule> {
    return {
      ngModule: SpringAuthModule,
      providers: [
        { provide: SPRING_AUTH_CONFIG, useValue: config },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
      ],
    };
  }
}

// ─── Standalone / provideX helpers (Angular 15+) ─────────────────────────────

import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';

/**
 * Functional providers for standalone Angular apps.
 *
 * @example
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideRouter(routes),
 *     provideHttpClient(withInterceptors([authInterceptor])),
 *     ...provideSpringAuth({ apiUrl: 'http://localhost:8080/api' }),
 *   ]
 * };
 */
export function provideSpringAuth(config: SpringAuthConfig): (Provider | EnvironmentProviders)[] {
  return [
    { provide: SPRING_AUTH_CONFIG, useValue: config },
    AuthService,
  ];
}
