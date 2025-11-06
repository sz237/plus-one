package com.plusone.PlusOneBackend.controller;

import com.plusone.PlusOneBackend.dto.AuthResponse;
import com.plusone.PlusOneBackend.dto.LoginRequest;
import com.plusone.PlusOneBackend.dto.SignupRequest;
import com.plusone.PlusOneBackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * POST /api/auth/signup
     * Register a new user with Vanderbilt email
     */
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        
        // Check if signup was successful
        if (response.getMessage().equals("Signup successful")) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * POST /api/auth/login
     * Login existing user
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        
        // Check if login was successful
        if (response.getMessage().equals("Login successful")) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * GET /api/auth/test
     * Test endpoint to verify backend is running
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Backend is running! 🚀");
    }

    /**
     * GET /api/auth/users
     * Get all users (for testing purposes)
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            // This would need to be implemented in AuthService
            return ResponseEntity.ok("Users endpoint - implement this to see all users");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}


