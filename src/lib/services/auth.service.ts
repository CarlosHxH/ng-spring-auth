import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  throwError,
  from,
  of,
} from 'rxjs';
import {
  tap,
  catchError,
  switchMap,
  map,
  finalize,
} from 'rxjs/operators';

import {
  SpringAuthConfig,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  TokenPayload,
  AuthState,
  AuthUser,
} from '../models/auth.models';
import { SPRING_AUTH_CONFIG } from '../models/auth.tokens';

/** Default resolved configuration */
const DEFAULT_CONFIG: Required<SpringAuthConfig> = {
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
    user: 'auth_user',
  },
  autoRefresh: true,
  logoutRedirect: '/login',
  loginSuccessRedirect: '/dashboard',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly cfg: Required<SpringAuthConfig>;

  private readonly _state$ = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null,
  });

  /** Emits the full auth state on every change */
  readonly state$: Observable<AuthState> = this._state$.asObservable();

  /** Convenience streams */
  readonly isAuthenticated$ = this.state$.pipe(map((s) => s.isAuthenticated));
  readonly user$ = this.state$.pipe(map((s) => s.user));
  readonly loading$ = this.state$.pipe(map((s) => s.loading));
  readonly error$ = this.state$.pipe(map((s) => s.error));

  // flag used by the interceptor to avoid parallel refresh storms
  private _refreshing = false;
  private _refreshQueue: Array<(token: string | null) => void> = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    @Optional() @Inject(SPRING_AUTH_CONFIG) userConfig: SpringAuthConfig | null
  ) {
    this.cfg = this._mergeConfig(userConfig);
    this._restoreSession();
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Authenticates the user against Spring Boot.
   * Stores tokens and emits updated state on success.
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this._patch({ loading: true, error: null });
    const url = this._url('login');

    return this.http.post<AuthResponse>(url, credentials).pipe(
      tap((res) => this._handleAuthResponse(res)),
      catchError((err) => this._handleError(err)),
      finalize(() => this._patch({ loading: false }))
    );
  }

  /**
   * Registers a new user. Optionally logs in immediately if the server
   * returns an AuthResponse (tokens included).
   */
  register(payload: RegisterRequest): Observable<AuthResponse | unknown> {
    this._patch({ loading: true, error: null });
    const url = this._url('register');

    return this.http.post<AuthResponse>(url, payload).pipe(
      tap((res) => {
        // If Spring Boot returns tokens on register, persist them
        if (res && (res as AuthResponse).accessToken) {
          this._handleAuthResponse(res as AuthResponse);
        }
      }),
      catchError((err) => this._handleError(err)),
      finalize(() => this._patch({ loading: false }))
    );
  }

  /**
   * Logs the user out. Calls the Spring Boot logout endpoint (best-effort)
   * then clears local state and redirects.
   */
  logout(): void {
    const refreshToken = this.getRefreshToken();
    const url = this._url('logout');

    // best-effort server-side revocation
    if (refreshToken) {
      this.http
        .post(url, { refreshToken } as RefreshTokenRequest)
        .pipe(catchError(() => of(null)))
        .subscribe();
    }

    this._clearSession();
    this.router.navigate([this.cfg.logoutRedirect]);
  }

  /**
   * Uses the stored refresh token to obtain a new access token.
   * Returns the new access token string (useful for the interceptor).
   */
  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const url = this._url('refresh');
    const body: RefreshTokenRequest = { refreshToken };

    return this.http.post<AuthResponse>(url, body).pipe(
      tap((res) => this._handleAuthResponse(res)),
      map((res) => res.accessToken),
      catchError((err) => {
        this._clearSession();
        this.router.navigate([this.cfg.logoutRedirect]);
        return this._handleError(err);
      })
    );
  }

  /**
   * Fetches the current user profile from /auth/me.
   * Updates the user in state.
   */
  fetchProfile(): Observable<AuthUser> {
    const url = this._url('me');
    return this.http.get<AuthUser>(url).pipe(
      tap((user) => {
        this._patch({ user });
        this._saveToStorage(this.cfg.storageKeys.user, user);
      }),
      catchError((err) => this._handleError(err))
    );
  }

  // ─── Token helpers ───────────────────────────────────────────────────────────

  getAccessToken(): string | null {
    return this._state$.value.accessToken;
  }

  getRefreshToken(): string | null {
    return this._state$.value.refreshToken;
  }

  isAuthenticated(): boolean {
    return this._state$.value.isAuthenticated;
  }

  hasRole(role: string): boolean {
    return this._state$.value.user?.roles?.includes(role) ?? false;
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some((r) => this.hasRole(r));
  }

  /**
   * Decodes a JWT without verifying the signature (client-side only!).
   * Verification must happen on the server.
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as TokenPayload;
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }

  /**
   * Queues callers while a single refresh request is in flight.
   * Called by the interceptor.
   */
  refreshWithQueue(): Observable<string> {
    if (this._refreshing) {
      return new Observable((observer) => {
        this._refreshQueue.push((token) => {
          if (token) {
            observer.next(token);
            observer.complete();
          } else {
            observer.error(new Error('Token refresh failed'));
          }
        });
      });
    }

    this._refreshing = true;

    return this.refreshToken().pipe(
      tap((token) => {
        this._flushQueue(token);
        this._refreshing = false;
      }),
      catchError((err) => {
        this._flushQueue(null);
        this._refreshing = false;
        return throwError(() => err);
      })
    );
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private _handleAuthResponse(res: AuthResponse): void {
    const decoded = this.decodeToken(res.accessToken);

    const user: AuthUser = {
      username: res.username ?? decoded?.sub ?? '',
      email: res.email ?? (decoded?.email as string | undefined),
      roles: res.roles ?? (decoded?.roles as string[] | undefined) ?? [],
    };

    this._saveToStorage(this.cfg.storageKeys.accessToken, res.accessToken);
    if (res.refreshToken) {
      this._saveToStorage(this.cfg.storageKeys.refreshToken, res.refreshToken);
    }
    this._saveToStorage(this.cfg.storageKeys.user, user);

    this._patch({
      isAuthenticated: true,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken ?? this.getRefreshToken(),
      user,
      error: null,
    });
  }

  private _restoreSession(): void {
    const accessToken = this._loadFromStorage<string>(
      this.cfg.storageKeys.accessToken
    );
    const refreshToken = this._loadFromStorage<string>(
      this.cfg.storageKeys.refreshToken
    );
    const user = this._loadFromStorage<AuthUser>(this.cfg.storageKeys.user);

    if (accessToken && !this.isTokenExpired(accessToken)) {
      this._patch({ isAuthenticated: true, accessToken, refreshToken, user });
    } else if (refreshToken && this.cfg.autoRefresh) {
      // access token expired but we have a refresh token — try silently
      this._patch({ refreshToken });
      this.refreshToken().pipe(catchError(() => of(null))).subscribe();
    } else {
      this._clearSession();
    }
  }

  private _clearSession(): void {
    localStorage.removeItem(this.cfg.storageKeys.accessToken);
    localStorage.removeItem(this.cfg.storageKeys.refreshToken);
    localStorage.removeItem(this.cfg.storageKeys.user);

    this._patch({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
  }

  private _patch(partial: Partial<AuthState>): void {
    this._state$.next({ ...this._state$.value, ...partial });
  }

  private _saveToStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  private _loadFromStorage<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private _url(endpoint: keyof Required<SpringAuthConfig>['endpoints']): string {
    const base = this.cfg.apiUrl.replace(/\/$/, '');
    const path = (
      this.cfg.endpoints[endpoint] ??
      DEFAULT_CONFIG.endpoints[endpoint]
    )!;
    return `${base}${path}`;
  }

  private _handleError(err: HttpErrorResponse | Error): Observable<never> {
    const message =
      err instanceof HttpErrorResponse
        ? err.error?.message ?? err.message
        : err.message;

    this._patch({ error: message, loading: false });
    return throwError(() => err);
  }

  private _flushQueue(token: string | null): void {
    this._refreshQueue.forEach((cb) => cb(token));
    this._refreshQueue = [];
  }

  private _mergeConfig(
    user: SpringAuthConfig | null
  ): Required<SpringAuthConfig> {
    if (!user) return DEFAULT_CONFIG;

    return {
      apiUrl: user.apiUrl ?? DEFAULT_CONFIG.apiUrl,
      endpoints: { ...DEFAULT_CONFIG.endpoints, ...(user.endpoints ?? {}) },
      storageKeys: {
        ...DEFAULT_CONFIG.storageKeys,
        ...(user.storageKeys ?? {}),
      },
      autoRefresh: user.autoRefresh ?? DEFAULT_CONFIG.autoRefresh,
      logoutRedirect: user.logoutRedirect ?? DEFAULT_CONFIG.logoutRedirect,
      loginSuccessRedirect:
        user.loginSuccessRedirect ?? DEFAULT_CONFIG.loginSuccessRedirect,
    };
  }
}
