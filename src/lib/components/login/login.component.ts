import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { AuthResponse, LoginRequest } from '../../models/auth.models';

@Component({
  selector: 'spring-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spring-auth-card">
      <div class="spring-auth-header">
        <div class="spring-auth-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="#6366f1"/>
            <path d="M10 18C10 13.58 13.58 10 18 10C22.42 10 26 13.58 26 18C26 22.42 22.42 26 18 26"
              stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="18" cy="18" r="3.5" fill="white"/>
          </svg>
        </div>
        <h2 class="spring-auth-title">{{ title }}</h2>
        <p class="spring-auth-subtitle">{{ subtitle }}</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="spring-auth-form">

        <div class="spring-field" [class.spring-field--error]="isInvalid('username')">
          <label class="spring-label" for="sa-username">Usuário</label>
          <input
            id="sa-username"
            class="spring-input"
            type="text"
            formControlName="username"
            placeholder="seu.usuario"
            autocomplete="username"
          />
          <span class="spring-error" *ngIf="isInvalid('username')">
            Usuário é obrigatório.
          </span>
        </div>

        <div class="spring-field" [class.spring-field--error]="isInvalid('password')">
          <label class="spring-label" for="sa-password">Senha</label>
          <div class="spring-input-wrapper">
            <input
              id="sa-password"
              class="spring-input"
              [type]="showPassword ? 'text' : 'password'"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="spring-toggle-pw"
              (click)="showPassword = !showPassword"
              [attr.aria-label]="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
            >
              <svg *ngIf="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg *ngIf="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <span class="spring-error" *ngIf="isInvalid('password')">
            Senha é obrigatória.
          </span>
        </div>

        <div class="spring-error-banner" *ngIf="errorMessage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="spring-btn-primary"
          [disabled]="loading"
        >
          <span class="spring-spinner" *ngIf="loading"></span>
          <span>{{ loading ? 'Entrando…' : 'Entrar' }}</span>
        </button>

        <div class="spring-auth-footer" *ngIf="showRegisterLink">
          <span>Não tem conta?</span>
          <a class="spring-link" (click)="goToRegister()">Criar conta</a>
        </div>

      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .spring-auth-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,.06);
      font-family: 'Inter', system-ui, sans-serif;
    }

    .spring-auth-header { text-align: center; margin-bottom: 2rem; }
    .spring-auth-logo { margin-bottom: .75rem; }
    .spring-auth-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 .25rem; }
    .spring-auth-subtitle { font-size: .875rem; color: #6b7280; margin: 0; }

    .spring-auth-form { display: flex; flex-direction: column; gap: 1.25rem; }

    .spring-field { display: flex; flex-direction: column; gap: .375rem; }
    .spring-label { font-size: .8125rem; font-weight: 600; color: #374151; }

    .spring-input-wrapper { position: relative; }
    .spring-input {
      width: 100%; padding: .625rem .875rem; border: 1.5px solid #d1d5db;
      border-radius: 8px; font-size: .9375rem; color: #111827;
      background: #fafafa; transition: border-color .15s, box-shadow .15s;
      box-sizing: border-box; outline: none;
    }
    .spring-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); background: #fff; }
    .spring-field--error .spring-input { border-color: #ef4444; }
    .spring-field--error .spring-input:focus { box-shadow: 0 0 0 3px rgba(239,68,68,.12); }
    .spring-input-wrapper .spring-input { padding-right: 2.75rem; }

    .spring-toggle-pw {
      position: absolute; right: .625rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #9ca3af; padding: .25rem;
      display: flex; align-items: center; transition: color .15s;
    }
    .spring-toggle-pw:hover { color: #6366f1; }

    .spring-error { font-size: .75rem; color: #ef4444; }

    .spring-error-banner {
      display: flex; align-items: center; gap: .5rem;
      background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 8px; padding: .75rem 1rem;
      font-size: .875rem; color: #dc2626;
    }

    .spring-btn-primary {
      display: flex; align-items: center; justify-content: center; gap: .625rem;
      background: #6366f1; color: #fff; border: none; border-radius: 8px;
      padding: .75rem 1rem; font-size: .9375rem; font-weight: 600;
      cursor: pointer; transition: background .15s, transform .1s;
      margin-top: .25rem;
    }
    .spring-btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .spring-btn-primary:active:not(:disabled) { transform: scale(.98); }
    .spring-btn-primary:disabled { opacity: .6; cursor: not-allowed; }

    .spring-spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff; border-radius: 50%; animation: sa-spin .7s linear infinite;
    }
    @keyframes sa-spin { to { transform: rotate(360deg); } }

    .spring-auth-footer {
      text-align: center; font-size: .875rem; color: #6b7280;
      display: flex; justify-content: center; gap: .375rem;
    }
    .spring-link { color: #6366f1; cursor: pointer; font-weight: 600; }
    .spring-link:hover { text-decoration: underline; }
  `],
})
export class LoginComponent implements OnInit, OnDestroy {
  @Input() title = 'Bem-vindo de volta';
  @Input() subtitle = 'Entre com suas credenciais para continuar';
  @Input() redirectAfterLogin: string | null = null;
  @Input() showRegisterLink = true;
  @Input() registerPath = '/register';

  @Output() loginSuccess = new EventEmitter<AuthResponse>();
  @Output() loginError = new EventEmitter<unknown>();
  @Output() registerClick = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  showPassword = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    this.auth.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((l) => (this.loading = l));

    this.auth.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((e) => (this.errorMessage = e ?? ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isInvalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c?.invalid && c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: LoginRequest = this.form.value;
    this.auth
      .login(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loginSuccess.emit(res);
          const redirect = this.redirectAfterLogin ?? '/dashboard';
          this.router.navigate([redirect]);
        },
        error: (err) => this.loginError.emit(err),
      });
  }

  goToRegister(): void {
    this.registerClick.emit();
    if (!this.registerClick.observed) {
      this.router.navigate([this.registerPath]);
    }
  }
}
