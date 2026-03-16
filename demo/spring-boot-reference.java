// ═══════════════════════════════════════════════════════════════════════════════
// REFERÊNCIA — Spring Boot Backend esperado pela biblioteca Angular
// ═══════════════════════════════════════════════════════════════════════════════

// ─── AuthController.java ─────────────────────────────────────────────────────
/*
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired private AuthService authService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private RefreshTokenService refreshTokenService;
    @Autowired private UserDetailsServiceImpl userDetailsService;

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        authService.authenticate(req.getUsername(), req.getPassword());
        UserDetails user = userDetailsService.loadUserByUsername(req.getUsername());
        String accessToken  = jwtUtil.generateToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(req.getUsername()).getToken();

        return ResponseEntity.ok(AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(3600L)
            .username(user.getUsername())
            .roles(user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()))
            .build());
    }

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest req) {
        UserDetails user = authService.register(req);
        String accessToken  = jwtUtil.generateToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(user.getUsername()).getToken();

        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .username(user.getUsername())
            .build());
    }

    // POST /api/auth/refresh
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshTokenRequest req) {
        return refreshTokenService.findByToken(req.getRefreshToken())
            .map(refreshTokenService::verifyExpiration)
            .map(token -> {
                UserDetails user = userDetailsService.loadUserByUsername(token.getUser().getUsername());
                String newAccess  = jwtUtil.generateToken(user);
                String newRefresh = refreshTokenService.createRefreshToken(user.getUsername()).getToken();
                return ResponseEntity.ok(AuthResponse.builder()
                    .accessToken(newAccess)
                    .refreshToken(newRefresh)
                    .tokenType("Bearer")
                    .build());
            })
            .orElseThrow(() -> new RuntimeException("Refresh token inválido ou expirado"));
    }

    // POST /api/auth/logout
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshTokenRequest req) {
        refreshTokenService.deleteByToken(req.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    // GET /api/auth/me
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(UserResponse.builder()
            .username(user.getUsername())
            .roles(user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()))
            .build());
    }
}
*/

// ─── AuthResponse.java ────────────────────────────────────────────────────────
/*
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long   expiresIn;
    private String username;
    private String email;
    private List<String> roles;
}
*/

// ─── SecurityConfig.java (permissões) ────────────────────────────────────────
/*
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/refresh").permitAll()
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
}
*/

// ─── application.properties ───────────────────────────────────────────────────
/*
spring.application.name=minha-api
server.port=8080

# CORS
spring.mvc.cors.allowed-origins=http://localhost:4200
spring.mvc.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.mvc.cors.allowed-headers=*
spring.mvc.cors.allow-credentials=true

# JWT
jwt.secret=sua-chave-secreta-muito-longa-e-segura-aqui-256bits
jwt.expiration=3600000
jwt.refresh-expiration=604800000
*/
