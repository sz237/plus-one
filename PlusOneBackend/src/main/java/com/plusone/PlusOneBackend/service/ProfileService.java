package com.plusone.PlusOneBackend.service;

import com.plusone.PlusOneBackend.dto.ProfileResponse;
import com.plusone.PlusOneBackend.dto.ProfileUpdateRequest;
import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.model.Profile;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.ConnectionRepository;
import com.plusone.PlusOneBackend.repository.ConnectionRequestRepository;
import com.plusone.PlusOneBackend.repository.PostRepository;
import com.plusone.PlusOneBackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProfileService {

    private static final int DEFAULT_ONBOARDING_STEP = 1;
    private static final int MAX_ONBOARDING_STEP = 4;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private ConnectionRequestRepository connectionRequestRepository;

    @Autowired
    private PostRepository postRepository;

    /**
     * Get user profile with counts.
     */
    public ProfileResponse getProfile(String userId) {
        User user = findUserOrThrow(userId);

        int connectionsCount = getConnectionsCount(userId);
        int requestsCount = getPendingRequestsCount(userId);

        List<Post> posts = getUserPosts(userId);

        return buildProfileResponse(user, connectionsCount, requestsCount, posts);
    }

    /**
     * Update the user's profile and onboarding progress, returning the updated profile response.
     */
    public ProfileResponse updateProfile(String userId, ProfileUpdateRequest updateRequest) {
        if (updateRequest == null) {
            throw new IllegalArgumentException("Profile update request cannot be null");
        }

        User user = findUserOrThrow(userId);

        if (updateRequest.getProfile() != null) {
            Profile sanitizedProfile = sanitizeProfile(updateRequest.getProfile());
            user.setProfile(sanitizedProfile);
        }

        applyOnboardingUpdates(user, updateRequest.getStep(), updateRequest.getCompleted());

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        int connectionsCount = getConnectionsCount(userId);
        int requestsCount = getPendingRequestsCount(userId);

        List<Post> posts = getUserPosts(userId);

        return buildProfileResponse(user, connectionsCount, requestsCount, posts);
    }

    private User findUserOrThrow(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found for userId: " + userId);
        }

        User user = userOpt.get();
        if (user.getProfile() == null) {
            user.setProfile(new Profile());
        }
        if (user.getOnboarding() == null) {
            user.setOnboarding(new User.Onboarding(false, DEFAULT_ONBOARDING_STEP, null));
        } else if (user.getOnboarding().getStep() == null) {
            user.getOnboarding().setStep(DEFAULT_ONBOARDING_STEP);
        }

        return user;
    }

    private Profile sanitizeProfile(Profile profile) {
        Profile sanitized = profile != null ? profile : new Profile();

        if (sanitized.getLocation() == null) {
            sanitized.setLocation(new Profile.Location());
        }
        if (sanitized.getJob() == null) {
            sanitized.setJob(new Profile.Job());
        }
        if (sanitized.getProfilePhoto() == null) {
            sanitized.setProfilePhoto(new Profile.Photo());
        }
        if (sanitized.getInterests() == null) {
            sanitized.setInterests(new ArrayList<>());
        } else {
            sanitized.setInterests(new ArrayList<>(sanitized.getInterests()));
        }

        if (sanitized.getNumConnections() < 0) {
            sanitized.setNumConnections(0);
        }
        if (sanitized.getNumRequests() < 0) {
            sanitized.setNumRequests(0);
        }

        return sanitized;
    }

    private void applyOnboardingUpdates(User user, Integer step, Boolean completed) {
        User.Onboarding onboarding = user.getOnboarding();
        if (onboarding == null) {
            onboarding = new User.Onboarding(false, DEFAULT_ONBOARDING_STEP, null);
        }

        if (step != null) {
            int normalizedStep = Math.max(DEFAULT_ONBOARDING_STEP, Math.min(step, MAX_ONBOARDING_STEP));
            onboarding.setStep(normalizedStep);
        }

        if (completed != null) {
            onboarding.setCompleted(completed);
            if (completed) {
                if (onboarding.getCompletedAt() == null) {
                    onboarding.setCompletedAt(LocalDateTime.now());
                }
            } else {
                onboarding.setCompletedAt(null);
            }
        }

        user.setOnboarding(onboarding);
    }

    private int getConnectionsCount(String userId) {
        try {
            return connectionRepository.countConnectionsForUser(userId);
        } catch (Exception e) {
            System.err.println("Error counting connections for user " + userId + ": " + e.getMessage());
            return 0;
        }
    }

    private int getPendingRequestsCount(String userId) {
        try {
            return connectionRequestRepository.countByToUserIdAndStatus(userId, "PENDING");
        } catch (Exception e) {
            System.err.println("Error counting requests for user " + userId + ": " + e.getMessage());
            return 0;
        }
    }

    private List<Post> getUserPosts(String userId) {
        try {
            return postRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } catch (Exception e) {
            System.err.println("Error fetching posts for user " + userId + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    private ProfileResponse buildProfileResponse(User user, int connectionsCount, int requestsCount, List<Post> posts) {
        Profile profile = user.getProfile() != null ? user.getProfile() : new Profile();
        User.Onboarding onboarding = user.getOnboarding();
        if (onboarding == null) {
            onboarding = new User.Onboarding(false, DEFAULT_ONBOARDING_STEP, null);
        }

        return ProfileResponse.builder()
            .userId(user.getId())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .connectionsCount(connectionsCount)
            .requestsCount(requestsCount)
            .postsCount(posts != null ? posts.size() : 0)
            .posts(posts != null ? posts : new ArrayList<>())
            .profile(profile)
            .onboarding(ProfileResponse.OnboardingData.builder()
                .completed(onboarding.isCompleted())
                .step(onboarding.getStep() != null ? onboarding.getStep() : DEFAULT_ONBOARDING_STEP)
                .completedAt(onboarding.getCompletedAt() != null ? onboarding.getCompletedAt().toString() : null)
                .build())
            .build();
    }
}
