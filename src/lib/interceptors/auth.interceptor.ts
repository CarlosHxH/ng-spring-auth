import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP interceptor that:
 *  1. Attaches the Bearer token to every outgoing request.
 *  2. On a 401 response, attempts a silent token refresh (once) and retries.
 *  3. On a second 401, clears the session and propagates the error.
 *
 * Register in your app config:
 *   provideHttpClient(withInterceptors([authInterceptor]))
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);

  const addToken = (r: HttpRequest<unknown>, token: string | null) =>
    token
      ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : r;

  const handle = (
    r: HttpRequest<unknown>,
    retried = false
  ): Observable<HttpEvent<unknown>> =>
    next(addToken(r, auth.getAccessToken())).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !retried && auth.getRefreshToken()) {
          return auth.refreshWithQueue().pipe(
            switchMap((newToken) =>
              next(addToken(r, newToken))
            ),
            catchError((refreshErr) => {
              auth.logout();
              return throwError(() => refreshErr);
            })
          );
        }
        return throwError(() => err);
      })
    );

  return handle(req);
};

// ─── Legacy class-based interceptor (for apps still using HttpClientModule) ──

import {
  Injectable,
} from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest as NgHttpRequest,
} from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(
    req: NgHttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = this.auth.getAccessToken();
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && this.auth.getRefreshToken()) {
          return this.auth.refreshWithQueue().pipe(
            switchMap((newToken) =>
              next.handle(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` },
                })
              )
            ),
            catchError((refreshErr) => {
              this.auth.logout();
              return throwError(() => refreshErr);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }
}
