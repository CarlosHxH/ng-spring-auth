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
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/auth.models';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'spring-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spring-auth-card">
      <div class="spring-auth-header">
        <div class="spring-auth-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="#6366f1"/>
            <path d="M18 10v16M10 18h16" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="spring-auth-title">{{ title }}</h2>
        <p class="spring-auth-subtitle">{{ subtitle }}</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="spring-auth-form">

        <div class="spring-field-row" *ngIf="showName">
          <div class="spring-field" [class.spring-field--error]="isInvalid('firstName')">
            <label class="spring-label">Nome</label>
            <input class="spring-input" formControlName="firstName" placeholder="João" autocomplete="given-name"/>
          </div>
          <div class="spring-field" [class.spring-field--error]="isInvalid('lastName')">
            <label class="spring-label">Sobrenome</label>
            <input class="spring-input" formControlName="lastName" placeholder="Silva" autocomplete="family-name"/>
          </div>
        </div>

        <div class="spring-field" [class.spring-field--error]="isInvalid('username')">
          <label class="spring-label">Usuário</label>
          <input class="spring-input" formControlName="username" placeholder="joao.silva" autocomplete="username"/>
          <span class="spring-error" *ngIf="isInvalid('username')">Usuário é obrigatório (mín. 3 caracteres).</span>
        </div>

        <div class="spring-field" [class.spring-field--error]="isInvalid('email')">
          <label class="spring-label">E-mail</label>
          <input class="spring-input" type="email" formControlName="email" placeholder="joao@exemplo.com" autocomplete="email"/>
          <span class="spring-error" *ngIf="isInvalid('email')">Informe um e-mail válido.</span>
        </div>

        <div class="spring-field" [class.spring-field--error]="isInvalid('password')">
          <label class="spring-label">Senha</label>
          <div class="spring-input-wrapper">
            <input class="spring-input" [type]="showPw ? 'text' : 'password'"
              formControlName="password" placeholder="Mínimo 8 caracteres" autocomplete="new-password"/>
            <button type="button" class="spring-toggle-pw" (click)="showPw = !showPw">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path *ngIf="!showPw" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle *ngIf="!showPw" cx="12" cy="12" r="3"/>
                <path *ngIf="showPw" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line *ngIf="showPw" x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <span class="spring-error" *ngIf="isInvalid('password')">Senha deve ter no mínimo 8 caracteres.</span>

          <!-- password strength bar -->
          <div class="spring-strength" *ngIf="form.get('password')?.value">
            <div class="spring-strength-bar">
              <div class="spring-strength-fill" [style.width]="strengthPct + '%'" [class]="'strength-' + strengthLabel"></div>
            </div>
            <span class="spring-strength-label" [class]="'strength-' + strengthLabel">{{ strengthLabel }}</span>
          </div>
        </div>

        <div class="spring-field" [class.spring-field--error]="isInvalid('confirmPassword') || form.hasError('passwordMismatch')">
          <label class="spring-label">Confirmar senha</label>
          <input class="spring-input" [type]="showPw ? 'text' : 'password'"
            formControlName="confirmPassword" placeholder="Repita a senha" autocomplete="new-password"/>
          <span class="spring-error" *ngIf="form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched">
            As senhas não conferem.
          </span>
        </div>

        <div class="spring-error-banner" *ngIf="errorMessage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ errorMessage }}
        </div>

        <button type="submit" class="spring-btn-primary" [disabled]="loading">
          <span class="spring-spinner" *ngIf="loading"></span>
          <span>{{ loading ? 'Criando conta…' : 'Criar conta' }}</span>
        </button>

        <div class="spring-auth-footer" *ngIf="showLoginLink">
          <span>Já tem conta?</span>
          <a class="spring-link" (click)="goToLogin()">Entrar</a>
        </div>

      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }
    /* reuse login styles + extras */
    .spring-auth-card {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 16px;
      padding: 2.5rem; max-width: 480px; width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,.06);
      font-family: 'Inter', system-ui, sans-serif;
    }
    .spring-auth-header { text-align: center; margin-bottom: 2rem; }
    .spring-auth-logo { margin-bottom: .75rem; }
    .spring-auth-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 .25rem; }
    .spring-auth-subtitle { font-size: .875rem; color: #6b7280; margin: 0; }
    .spring-auth-form { display: flex; flex-direction: column; gap: 1.125rem; }
    .spring-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
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
    .spring-strength { display: flex; align-items: center; gap: .5rem; margin-top: .25rem; }
    .spring-strength-bar { flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden; }
    .spring-strength-fill { height: 100%; border-radius: 2px; transition: width .3s; }
    .strength-Fraca .spring-strength-fill, .strength-Fraca { background: #ef4444; color: #ef4444; }
    .strength-Média .spring-strength-fill, .strength-Média { background: #f59e0b; color: #f59e0b; }
    .strength-Boa .spring-strength-fill, .strength-Boa { background: #3b82f6; color: #3b82f6; }
    .strength-Forte .spring-strength-fill, .strength-Forte { background: #10b981; color: #10b981; }
    .spring-strength-label { font-size: .75rem; font-weight: 600; white-space: nowrap; }
    .spring-btn-primary {
      display: flex; align-items: center; justify-content: center; gap: .625rem;
      background: #6366f1; color: #fff; border: none; border-radius: 8px;
      padding: .75rem 1rem; font-size: .9375rem; font-weight: 600;
      cursor: pointer; transition: background .15s, transform .1s; margin-top: .25rem;
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
export class RegisterComponent implements OnInit, OnDestroy {
  @Input() title = 'Criar conta';
  @Input() subtitle = 'Preencha os dados para se cadastrar';
  @Input() showName = true;
  @Input() showLoginLink = true;
  @Input() loginPath = '/login';
  @Input() redirectAfterRegister: string | null = null;

  @Output() registerSuccess = new EventEmitter<unknown>();
  @Output() registerError = new EventEmitter<unknown>();
  @Output() loginClick = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  showPw = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  get strengthPct(): number {
    const pw: string = this.form.get('password')?.value ?? '';
    let score = 0;
    if (pw.length >= 8) score += 25;
    if (/[A-Z]/.test(pw)) score += 25;
    if (/[0-9]/.test(pw)) score += 25;
    if (/[^A-Za-z0-9]/.test(pw)) score += 25;
    return score;
  }

  get strengthLabel(): string {
    const p = this.strengthPct;
    if (p <= 25) return 'Fraca';
    if (p <= 50) return 'Média';
    if (p <= 75) return 'Boa';
    return 'Forte';
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        firstName: [''],
        lastName: [''],
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );

    this.auth.loading$.pipe(takeUntil(this.destroy$)).subscribe((l) => (this.loading = l));
    this.auth.error$.pipe(takeUntil(this.destroy$)).subscribe((e) => (this.errorMessage = e ?? ''));
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
    const { confirmPassword, ...payload } = this.form.value;
    const req: RegisterRequest = payload;

    this.auth
      .register(req)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.registerSuccess.emit(res);
          const redirect = this.redirectAfterRegister ?? '/dashboard';
          this.router.navigate([redirect]);
        },
        error: (err) => this.registerError.emit(err),
      });
  }

  goToLogin(): void {
    this.loginClick.emit();
    if (!this.loginClick.observed) {
      this.router.navigate([this.loginPath]);
    }
  }
}
