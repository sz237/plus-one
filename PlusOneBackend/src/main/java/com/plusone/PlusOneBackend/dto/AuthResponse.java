package com.plusone.PlusOneBackend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String message;
    private String userId;
    private String email;
    private String firstName;
    private String lastName;
    
    // Constructor for error messages
    public AuthResponse(String message) {
        this.message = message;
    }
}


