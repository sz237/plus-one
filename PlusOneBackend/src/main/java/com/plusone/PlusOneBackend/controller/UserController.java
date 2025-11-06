package com.plusone.PlusOneBackend.controller;

import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.service.UserSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Handles user-related API requests.
 * Example: GET /api/users/search?q=fitness
 */
@CrossOrigin(origins = "http://localhost:5173") // allow frontend requests from Vite dev server
@RestController
@RequestMapping("/api/users")

public class UserController {
    private final UserSearchService userSearchService;

    public UserController(UserSearchService userSearchService) {
        this.userSearchService = userSearchService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(
            @RequestParam("q") String query,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(List.of()); // return empty list for empty query
        }

        List<User> users = userSearchService.searchByInterest(query, limit);
        return ResponseEntity.ok(users);
    }
}
