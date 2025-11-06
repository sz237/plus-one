package com.plusone.PlusOneBackend.controller;

import com.plusone.PlusOneBackend.dto.ProfileResponse;
import com.plusone.PlusOneBackend.dto.ProfileUpdateRequest;
import com.plusone.PlusOneBackend.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:3000"},
    allowCredentials = "true"
)
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    /**
     * Get user profile with counts
     */
    @GetMapping("/{userId}/profile")
    public ResponseEntity<ProfileResponse> getProfile(@PathVariable String userId) {
        try {
            System.out.println("Getting profile for userId: " + userId);
            ProfileResponse profile = profileService.getProfile(userId);
            System.out.println("Profile found: " + profile.getFirstName() + " " + profile.getLastName());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            System.err.println("Error getting profile for userId " + userId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update user profile and onboarding progress.
     */
    @PutMapping("/{userId}/profile")
    public ResponseEntity<ProfileResponse> updateProfile(
        @PathVariable String userId,
        @RequestBody ProfileUpdateRequest updateRequest
    ) {
        try {
            System.out.println("Updating profile for userId: " + userId);
            ProfileResponse updatedProfile = profileService.updateProfile(userId, updateRequest);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            System.err.println("Error updating profile for userId " + userId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
