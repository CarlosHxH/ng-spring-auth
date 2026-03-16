# @auth/ng-spring-auth

Biblioteca Angular completa para autenticação com Spring Boot usando JWT.

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---|---|
| **AuthService** | Login, registro, logout, refresh automático de tokens |
| **authInterceptor** | Injeta `Bearer` em todas as requests; renova token em 401 |
| **Guards funcionais** | `authGuard`, `roleGuard`, `guestGuard`, `canMatchAuthGuard` |
| **LoginComponent** | Formulário de login pronto com validação e toggle de senha |
| **RegisterComponent** | Formulário de cadastro com indicador de força de senha |
| **Standalone & NgModule** | Suporta as duas abordagens do Angular |
| **TypeScript completo** | Todos os tipos exportados |

---

## 📦 Instalação

```bash
npm install @auth/ng-spring-auth
```

---

## ⚡ Início Rápido

### Standalone App (Angular 15+)

```typescript
// app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideSpringAuth, authInterceptor } from '@auth/ng-spring-auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    ...provideSpringAuth({
      apiUrl: 'http://localhost:8080/api',
    }),
  ],
};
```

### NgModule App

```typescript
// app.module.ts
import { SpringAuthModule } from '@auth/ng-spring-auth';

@NgModule({
  imports: [
    SpringAuthModule.forRoot({ apiUrl: 'http://localhost:8080/api' }),
  ],
})
export class AppModule {}
```

---

## 🛣️ Protegendo Rotas

```typescript
import { authGuard, roleGuard, guestGuard, canMatchAuthGuard } from '@auth/ng-spring-auth';

const routes: Routes = [
  { path: 'login',    canActivate: [guestGuard],  component: LoginPageComponent },
  { path: 'dashboard', canActivate: [authGuard],  component: DashboardComponent },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    component: AdminComponent,
  },
  {
    path: 'app',
    canMatch: [canMatchAuthGuard],
    loadChildren: () => import('./features/app.routes'),
  },
];
```

---

## 🖼️ Componentes Prontos

```html
<!-- Login -->
<spring-login
  title="Portal"
  subtitle="Entre com suas credenciais"
  [showRegisterLink]="true"
  (loginSuccess)="onSuccess($event)"
  (loginError)="onError($event)"
/>

<!-- Registro -->
<spring-register
  [showName]="true"
  redirectAfterRegister="/dashboard"
  (registerSuccess)="onSuccess($event)"
/>
```

### Inputs do `<spring-login>`

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `title` | string | `'Bem-vindo de volta'` | Título do card |
| `subtitle` | string | `'Entre com suas credenciais...'` | Subtítulo |
| `redirectAfterLogin` | string \| null | `null` | Rota após login |
| `showRegisterLink` | boolean | `true` | Exibir link de cadastro |
| `registerPath` | string | `'/register'` | Rota do cadastro |

### Outputs do `<spring-login>`

| Output | Tipo | Descrição |
|---|---|---|
| `loginSuccess` | `EventEmitter<AuthResponse>` | Login bem-sucedido |
| `loginError` | `EventEmitter<unknown>` | Erro no login |
| `registerClick` | `EventEmitter<void>` | Clique em "criar conta" |

---

## 🔧 AuthService API

```typescript
import { AuthService } from '@auth/ng-spring-auth';

constructor(private auth: AuthService) {}

// Observables
auth.state$           // AuthState completo
auth.isAuthenticated$ // boolean
auth.user$            // AuthUser | null
auth.loading$         // boolean
auth.error$           // string | null

// Métodos
auth.login({ username, password })         // Observable<AuthResponse>
auth.register({ username, email, ... })    // Observable<AuthResponse>
auth.logout()                              // void (redireciona)
auth.refreshToken()                        // Observable<string>
auth.fetchProfile()                        // Observable<AuthUser>

// Helpers
auth.isAuthenticated()                     // boolean (síncrono)
auth.hasRole('ADMIN')                      // boolean
auth.hasAnyRole('ADMIN', 'MANAGER')        // boolean
auth.getAccessToken()                      // string | null
auth.decodeToken(token)                    // TokenPayload | null
auth.isTokenExpired(token)                 // boolean
```

---

## ⚙️ Configuração Completa

```typescript
provideSpringAuth({
  apiUrl: 'http://localhost:8080/api',

  endpoints: {
    login:    '/auth/login',
    register: '/auth/register',
    refresh:  '/auth/refresh',
    logout:   '/auth/logout',
    me:       '/auth/me',
  },

  storageKeys: {
    accessToken:  'access_token',
    refreshToken: 'refresh_token',
    user:         'auth_user',
  },

  autoRefresh:          true,           // renova token silenciosamente ao carregar
  logoutRedirect:       '/login',       // rota após logout
  loginSuccessRedirect: '/dashboard',   // rota padrão após login
});
```

---

## 🌿 Endpoints Spring Boot esperados

| Método | Endpoint | Body | Retorno |
|---|---|---|---|
| POST | `/api/auth/login` | `{ username, password }` | `AuthResponse` |
| POST | `/api/auth/register` | `RegisterRequest` | `AuthResponse` |
| POST | `/api/auth/refresh` | `{ refreshToken }` | `AuthResponse` |
| POST | `/api/auth/logout` | `{ refreshToken }` | `204 No Content` |
| GET | `/api/auth/me` | — | `AuthUser` |

### Formato de AuthResponse

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "username": "joao.silva",
  "email": "joao@email.com",
  "roles": ["USER", "ADMIN"]
}
```

---

## 📁 Estrutura do Projeto

```
src/
├── lib/
│   ├── models/
│   │   ├── auth.models.ts      # Interfaces e tipos
│   │   └── auth.tokens.ts      # InjectionToken
│   ├── services/
│   │   └── auth.service.ts     # Serviço principal
│   ├── interceptors/
│   │   └── auth.interceptor.ts # Interceptor JWT
│   ├── guards/
│   │   └── auth.guard.ts       # Guards funcionais
│   ├── components/
│   │   ├── login/              # LoginComponent
│   │   └── register/           # RegisterComponent
│   └── spring-auth.module.ts   # NgModule + provideSpringAuth()
└── public-api.ts               # Barrel de exports
```

---

## 📜 Licença

MIT
