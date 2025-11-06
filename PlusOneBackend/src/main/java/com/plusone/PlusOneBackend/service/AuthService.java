package com.plusone.PlusOneBackend.service;

import com.plusone.PlusOneBackend.dto.AuthResponse;
import com.plusone.PlusOneBackend.dto.LoginRequest;
import com.plusone.PlusOneBackend.dto.SignupRequest;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String VANDERBILT_EMAIL_DOMAIN = "@vanderbilt.edu";

    /**
     * Register a new user with Vanderbilt email
     */
    public AuthResponse signup(SignupRequest request) {
        try {
            // Validate Vanderbilt email
            if (!isVanderbiltEmail(request.getEmail())) {
                return new AuthResponse("Only Vanderbilt email addresses (@vanderbilt.edu) are allowed");
            }

            // Check if user already exists
            if (userRepository.existsByEmail(request.getEmail())) {
                return new AuthResponse("Email already registered");
            }

            // Validate password strength
            if (request.getPassword() == null || request.getPassword().length() < 6) {
                return new AuthResponse("Password must be at least 6 characters long");
            }

            // Validate required fields
            if (request.getFirstName() == null || request.getFirstName().trim().isEmpty()) {
                return new AuthResponse("First name is required");
            }

            if (request.getLastName() == null || request.getLastName().trim().isEmpty()) {
                return new AuthResponse("Last name is required");
            }

            // Hash password
            String hashedPassword = passwordEncoder.encode(request.getPassword());

            // Create new user
            User newUser = new User(
                request.getEmail().toLowerCase().trim(),
                hashedPassword,
                request.getFirstName().trim(),
                request.getLastName().trim()
            );

            // Save to database
            User savedUser = userRepository.save(newUser);

            // Return success response
            return new AuthResponse(
                "Signup successful",
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName()
            );

        } catch (Exception e) {
            return new AuthResponse("Signup failed: " + e.getMessage());
        }
    }

    /**
     * Login existing user
     */
    public AuthResponse login(LoginRequest request) {
        try {
            // Find user by email
            Optional<User> userOptional = userRepository.findByEmail(request.getEmail().toLowerCase().trim());

            if (userOptional.isEmpty()) {
                return new AuthResponse("Invalid email or password");
            }

            User user = userOptional.get();

            // Verify password
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return new AuthResponse("Invalid email or password");
            }

            // Return success response
            return new AuthResponse(
                "Login successful",
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName()
            );

        } catch (Exception e) {
            return new AuthResponse("Login failed: " + e.getMessage());
        }
    }

    /**
     * Validate if email is a Vanderbilt email
     */
    private boolean isVanderbiltEmail(String email) {
        return email != null && email.toLowerCase().trim().endsWith(VANDERBILT_EMAIL_DOMAIN);
    }
}


