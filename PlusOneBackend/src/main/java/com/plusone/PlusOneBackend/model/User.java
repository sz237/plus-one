package com.plusone.PlusOneBackend.model;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.plusone.PlusOneBackend.model.User.Onboarding;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
@CompoundIndexes({
    @CompoundIndex(name = "onboarding_completed_created_idx", def = "{ 'onboarding.completed': 1, 'createdAt': -1 }"),
    @CompoundIndex(name = "location_city_idx", def = "{ 'profile.location.city': 1 }"),
    @CompoundIndex(name = "location_state_idx", def = "{ 'profile.location.state': 1 }")
})
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

    @Builder.Default
    private List<String> bookmarkedPostIds = new ArrayList<>();

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

    // Get profile photo URL for the frontend:
    @JsonProperty("profilePhotoUrl")
    public String getProfilePhotoUrl() {
        if (profile == null || profile.getProfilePhoto() == null)
            return null;
        return profile.getProfilePhoto().getUrl();
    }

    // Top-level job object with { title, companyName } that your UI expects:
    @JsonProperty("job")
    public java.util.Map<String, String> getJobPublic() {
        if (profile == null || profile.getJob() == null)
            return null;
        var j = profile.getJob();
        // companiesName → companyName (rename for the client)
        return java.util.Map.of(
                "title", j.getTitle() != null ? j.getTitle() : "",
                "companyName", j.getCompaniesName() != null ? j.getCompaniesName() : "");
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

    public List<String> getBookmarkedPostIds() {
        return bookmarkedPostIds;
    }

    public void setBookmarkedPostIds(List<String> bookmarkedPostIds) {
        this.bookmarkedPostIds = bookmarkedPostIds;
    }

    private Profile ensureProfile() {
        if (profile == null) {
            profile = new Profile();
        }
        return profile;
    }
}
