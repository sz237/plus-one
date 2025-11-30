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
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "mode", defaultValue = "interests") String mode,
            @RequestParam(value = "requestingUserId", required = false) String requestingUserId) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(List.of()); // return empty list for empty query
        }

        String trimmed = query.trim();
        int cappedLimit = Math.min(Math.max(limit, 1), 50);

        List<User> users = "name".equalsIgnoreCase(mode)
                ? userSearchService.searchByName(trimmed, cappedLimit)
                : userSearchService.searchByInterest(trimmed, cappedLimit, requestingUserId);
        return ResponseEntity.ok(users);
    }
}
