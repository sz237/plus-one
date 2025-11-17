package com.plusone.PlusOneBackend.controller;

import com.plusone.PlusOneBackend.dto.UserProfileDto;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.UserRepository;
import com.plusone.PlusOneBackend.service.UserSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Handles user-related API requests.
 * Example: GET /api/users/search?q=fitness
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserSearchService userSearchService;
    private final UserRepository userRepository;

    public UserController(UserSearchService userSearchService, UserRepository userRepository) {
        this.userSearchService = userSearchService;
        this.userRepository = userRepository;
    }

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(
            @RequestParam("q") String query,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "mode", defaultValue = "interests") String mode) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(List.of()); // return empty list for empty query
        }

        String trimmed = query.trim();
        int cappedLimit = Math.min(Math.max(limit, 1), 50);

        List<User> users = "name".equalsIgnoreCase(mode)
                ? userSearchService.searchByName(trimmed, cappedLimit)
                : userSearchService.searchByInterest(trimmed, cappedLimit);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/messenger/{messengerId}")
    public ResponseEntity<UserProfileDto> getByMessengerId(@PathVariable String messengerId) {
        if (messengerId == null || messengerId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<User> userOpt = userRepository.findByMessengerId(messengerId.trim().toLowerCase());
        return userOpt
            .map(this::toUserProfileDto)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    private UserProfileDto toUserProfileDto(User user) {
        return UserProfileDto.builder()
            .userId(user.getId())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .email(user.getEmail())
            .messengerId(user.getMessengerId())
            .profile(user.getProfile())
            .createdAt(user.getCreatedAt().toString())
            .build();
    }
}
