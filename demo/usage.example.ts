/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO — Como usar @auth/ng-spring-auth
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. STANDALONE APP (Angular 17+) ─────────────────────────────────────────

// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideSpringAuth,
  authInterceptor,
} from '@auth/ng-spring-auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    ...provideSpringAuth({
      apiUrl: 'http://localhost:8080/api',
      endpoints: {
        login: '/auth/login',
        register: '/auth/register',
        refresh: '/auth/refresh',
        logout: '/auth/logout',
        me: '/auth/me',
      },
      storageKeys: {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      },
      autoRefresh: true,
      logoutRedirect: '/login',
      loginSuccessRedirect: '/dashboard',
    }),
  ],
};

// ─── 2. MODULE-BASED APP ──────────────────────────────────────────────────────

// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { SpringAuthModule } from '@auth/ng-spring-auth';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SpringAuthModule.forRoot({
      apiUrl: 'http://localhost:8080/api',
    }),
  ],
})
export class AppModule {}

// ─── 3. ROUTING ───────────────────────────────────────────────────────────────

import {
  authGuard,
  roleGuard,
  guestGuard,
  canMatchAuthGuard,
} from '@auth/ng-spring-auth';

const routes = [
  // Public routes
  { path: 'login',    canActivate: [guestGuard],  loadComponent: () => import('./login-page.component') },
  { path: 'register', canActivate: [guestGuard],  loadComponent: () => import('./register-page.component') },

  // Protected routes
  { path: 'dashboard', canActivate: [authGuard],  loadComponent: () => import('./dashboard.component') },

  // Role-based routes
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./admin.component'),
  },

  // Lazy-loaded feature module
  {
    path: 'app',
    canMatch: [canMatchAuthGuard],
    loadChildren: () => import('./features/app.routes'),
  },
];

// ─── 4. USING COMPONENTS ──────────────────────────────────────────────────────

// login-page.component.ts
import { Component } from '@angular/core';
import { LoginComponent } from '@auth/ng-spring-auth';

@Component({
  standalone: true,
  imports: [LoginComponent],
  template: `
    <div class="center-page">
      <spring-login
        title="Portal Administrativo"
        subtitle="Entre com suas credenciais"
        [showRegisterLink]="true"
        registerPath="/register"
        (loginSuccess)="onSuccess($event)"
        (loginError)="onError($event)"
      />
    </div>
  `,
})
export class LoginPageComponent {
  onSuccess(res: any) { console.log('Logado!', res); }
  onError(err: any)   { console.error('Erro:', err); }
}

// ─── 5. USING AuthService DIRECTLY ───────────────────────────────────────────

import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth/ng-spring-auth';
import { AsyncPipe } from '@angular/common';

@Component({
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div *ngIf="auth.user$ | async as user">
      <p>Olá, {{ user.username }}!</p>
      <p>Funções: {{ user.roles.join(', ') }}</p>
      <button (click)="logout()">Sair</button>
    </div>
  `,
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}

  logout() { this.auth.logout(); }

  isAdmin()    { return this.auth.hasRole('ADMIN'); }
  isAuthenticated() { return this.auth.isAuthenticated(); }
}

// ─── 6. PROGRAMMATIC LOGIN ────────────────────────────────────────────────────

export class SomeService {
  constructor(private auth: AuthService) {}

  doLogin() {
    this.auth.login({ username: 'admin', password: 'secret' }).subscribe({
      next: (res) => console.log('Token:', res.accessToken),
      error: (err) => console.error(err),
    });
  }

  doRegister() {
    this.auth.register({
      username: 'novo.user',
      email: 'novo@email.com',
      password: 'MinhaSenha123!',
      roles: ['USER'],
    }).subscribe();
  }

  doRefresh() {
    this.auth.refreshToken().subscribe((token) => console.log('Novo token:', token));
  }

  getProfile() {
    this.auth.fetchProfile().subscribe((user) => console.log(user));
  }
}
