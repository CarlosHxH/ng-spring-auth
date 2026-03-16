import { inject } from '@angular/core';
import {
  CanActivateFn,
  CanMatchFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Route,
  UrlSegment,
} from '@angular/router';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

// ─── authGuard ───────────────────────────────────────────────────────────────
/**
 * Protects routes that require authentication.
 * Redirects to /login (or configured logoutRedirect) if not authenticated.
 *
 * Usage:
 *   { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent }
 */
export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated$.pipe(
    take(1),
    map((authenticated) => {
      if (authenticated) return true;
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    })
  );
};

// ─── roleGuard ───────────────────────────────────────────────────────────────
/**
 * Protects routes by role. Pass required roles via route data.
 *
 * Usage:
 *   {
 *     path: 'admin',
 *     canActivate: [roleGuard],
 *     data: { roles: ['ADMIN'] },
 *     component: AdminComponent
 *   }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
): Observable<boolean> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRoles: string[] = route.data?.['roles'] ?? [];

  return auth.user$.pipe(
    take(1),
    map((user) => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }
      const hasRole = requiredRoles.every((r) => user.roles.includes(r));
      if (!hasRole) {
        router.navigate(['/unauthorized']);
        return false;
      }
      return true;
    })
  );
};

// ─── canMatchGuard ───────────────────────────────────────────────────────────
/**
 * Lazy-loading guard: prevents loading the module if not authenticated.
 *
 * Usage:
 *   { path: 'admin', canMatch: [canMatchAuthGuard], loadChildren: () => import(...) }
 */
export const canMatchAuthGuard: CanMatchFn = (
  _route: Route,
  _segments: UrlSegment[]
): Observable<boolean> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated$.pipe(
    take(1),
    map((ok) => {
      if (!ok) router.navigate(['/login']);
      return ok;
    })
  );
};

// ─── guestGuard ──────────────────────────────────────────────────────────────
/**
 * Redirects authenticated users away from guest-only pages (e.g. /login).
 *
 * Usage:
 *   { path: 'login', canActivate: [guestGuard], component: LoginComponent }
 */
export const guestGuard: CanActivateFn = (): Observable<boolean> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated$.pipe(
    take(1),
    map((authenticated) => {
      if (authenticated) {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    })
  );
};
