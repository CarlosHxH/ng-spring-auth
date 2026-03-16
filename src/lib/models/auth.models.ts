// ─── Request / Response DTOs ─────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;          // e.g. "Bearer"
  expiresIn?: number;          // seconds
  username?: string;
  email?: string;
  roles?: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenPayload {
  sub: string;                 // subject (username / userId)
  email?: string;
  roles?: string[];
  iat?: number;                // issued at
  exp?: number;                // expiry
  [key: string]: unknown;
}

// ─── Library Configuration ────────────────────────────────────────────────────

export interface SpringAuthConfig {
  /** Base URL of your Spring Boot API, e.g. http://localhost:8080/api */
  apiUrl: string;

  /** Endpoint paths (relative to apiUrl) */
  endpoints?: {
    login?: string;            // default: /auth/login
    register?: string;         // default: /auth/register
    refresh?: string;          // default: /auth/refresh
    logout?: string;           // default: /auth/logout
    me?: string;               // default: /auth/me
  };

  /** localStorage / sessionStorage key names */
  storageKeys?: {
    accessToken?: string;      // default: 'access_token'
    refreshToken?: string;     // default: 'refresh_token'
    user?: string;             // default: 'auth_user'
  };

  /** Automatically attempt token refresh on 401? (default: true) */
  autoRefresh?: boolean;

  /** Route to redirect after logout (default: '/login') */
  logoutRedirect?: string;

  /** Route to redirect after successful login (default: '/dashboard') */
  loginSuccessRedirect?: string;
}

/** Resolved config with all optional fields filled (used internally) */
export interface ResolvedSpringAuthConfig {
  apiUrl: string;
  endpoints: {
    login: string;
    register: string;
    refresh: string;
    logout: string;
    me: string;
  };
  storageKeys: {
    accessToken: string;
    refreshToken: string;
    user: string;
  };
  autoRefresh: boolean;
  logoutRedirect: string;
  loginSuccessRedirect: string;
}

// ─── Internal Auth State ──────────────────────────────────────────────────────

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface AuthUser {
  username: string;
  email?: string;
  roles: string[];
  [key: string]: unknown;
}
