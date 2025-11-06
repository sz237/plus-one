package com.plusone.PlusOneBackend.model;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String password; // hashed before persistence

    private String firstName;

    private String lastName;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    /**
     * Embedded profile document with demographics, job, interests, photo, and
     * counters.
     */
    @Builder.Default
    private Profile profile = new Profile();

    /**
     * Onboarding progress (step slider 1..4 and completion flag).
     */
    @Builder.Default
    private Onboarding onboarding = new Onboarding(false, 1, null);

    // Constructor without ID (for new users)
    public User(String email, String password, String firstName, String lastName) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.profile = new Profile();
        this.onboarding = new Onboarding(false, 1, null);
    }

    /**
     * Expose interests from profile so JSON shows "interests": [...] at top level.
     */
    public List<String> getInterests() {
        return (profile != null && profile.getInterests() != null)
                ? profile.getInterests()
                : Collections.emptyList();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Onboarding {
        private boolean completed;
        private Integer step; // 1 to 4
        private LocalDateTime completedAt;
    }

    public int getNumConnections() {
        return profile != null ? profile.getNumConnections() : 0;
    }

    public void setNumConnections(int numConnections) {
        ensureProfile().setNumConnections(numConnections);
    }

    public int getNumRequests() {
        return profile != null ? profile.getNumRequests() : 0;
    }

    public void setNumRequests(int numRequests) {
        ensureProfile().setNumRequests(numRequests);
    }

    private Profile ensureProfile() {
        if (profile == null) {
            profile = new Profile();
        }
        return profile;
    }
}
