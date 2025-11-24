package com.plusone.PlusOneBackend.dto;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.model.Profile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {
    
    private String userId;
    private String firstName;
    private String lastName;
    private int connectionsCount;
    private int requestsCount;
    private int postsCount;
    private List<Post> posts;
    private Profile profile;
    private OnboardingData onboarding;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OnboardingData {
        private boolean completed;
        private int step;
        private String completedAt;
    }
}
