package com.plusone.PlusOneBackend.service;

import com.plusone.PlusOneBackend.dto.UserProfileDto;
import com.plusone.PlusOneBackend.model.Connection;
import com.plusone.PlusOneBackend.model.Profile;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.ConnectionRepository;
import com.plusone.PlusOneBackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    private static final double LOCATION_PRIORITY = 3.0;
    private static final double INTERESTS_PRIORITY = 2.0;
    
    private static final double LOCATION_EXACT_MATCH = 1.0;
    private static final double LOCATION_STATE_MATCH = 0.4;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ConnectionRepository connectionRepository;

    /**
     * Calculate location score between two users.
     * Exact match (city + state) = 1.0
     * Same state only = 0.4
     * No match = 0.0
     */
    public double calculateLocationScore(Profile.Location loc1, Profile.Location loc2) {
        if (loc1 == null || loc2 == null) {
            return 0.0;
        }
        
        String city1 = loc1.getCity();
        String state1 = loc1.getState();
        String city2 = loc2.getCity();
        String state2 = loc2.getState();
        
        // Handle null values
        if (city1 == null || state1 == null || city2 == null || state2 == null) {
            return 0.0;
        }
        
        // Normalize strings (trim and lowercase for case-insensitive matching)
        city1 = city1.trim().toLowerCase();
        state1 = state1.trim().toLowerCase();
        city2 = city2.trim().toLowerCase();
        state2 = state2.trim().toLowerCase();
        
        // Exact match (city and state)
        if (city1.equals(city2) && state1.equals(state2)) {
            return LOCATION_EXACT_MATCH;
        }
        
        // Same state only
        if (state1.equals(state2)) {
            return LOCATION_STATE_MATCH;
        }
        
        // No match
        return 0.0;
    }

    /**
     * Calculate interests score using Jaccard similarity.
     * Returns similarity score between 0.0 and 1.0.
     */
    public double calculateInterestsScore(List<String> interests1, List<String> interests2) {
        if (interests1 == null || interests2 == null || 
            interests1.isEmpty() || interests2.isEmpty()) {
            return 0.0;
        }
        
        // Normalize and convert to sets (lowercase, trim, filter empty strings)
        Set<String> set1 = interests1.stream()
            .map(String::toLowerCase)
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
        
        Set<String> set2 = interests2.stream()
            .map(String::toLowerCase)
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
        
        if (set1.isEmpty() || set2.isEmpty()) {
            return 0.0;
        }
        
        // Calculate intersection (shared interests)
        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);
        
        // Calculate union (all unique interests)
        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);
        
        if (union.isEmpty()) {
            return 0.0;
        }
        
        // Jaccard similarity: intersection / union
        return (double) intersection.size() / union.size();
    }

    /**
     * Calculate combined match score for a candidate user.
     * Total Score = (Location Score × 3) + (Interests Score × 2)
     */
    public double calculateMatchScore(User currentUser, User candidateUser) {
        if (currentUser == null || candidateUser == null ||
            currentUser.getProfile() == null || candidateUser.getProfile() == null) {
            return 0.0;
        }
        
        Profile currentProfile = currentUser.getProfile();
        Profile candidateProfile = candidateUser.getProfile();
        
        // Calculate location score
        double locationScore = calculateLocationScore(
            currentProfile.getLocation(),
            candidateProfile.getLocation()
        );
        
        // Calculate interests score
        double interestsScore = calculateInterestsScore(
            currentProfile.getInterests(),
            candidateProfile.getInterests()
        );
        
        // Combined score with priorities
        return (locationScore * LOCATION_PRIORITY) + (interestsScore * INTERESTS_PRIORITY);
    }

    /**
     * Get ranked users for discovery feed based on location and interests matching.
     * Returns users sorted by match score (highest first).
     * 
     * @param currentUserId The ID of the current user
     * @param limit Maximum number of users to return (default: 10)
     * @return List of ranked users as UserProfileDto
     */
    public List<UserProfileDto> getRankedUsers(String currentUserId, int limit) {
        // Get current user
        Optional<User> currentUserOpt = userRepository.findById(currentUserId);
        if (currentUserOpt.isEmpty()) {
            return Collections.emptyList();
        }
        User currentUser = currentUserOpt.get();
        
        // Get all users except current user
        List<User> allUsers = userRepository.findAll().stream()
            .filter(user -> !user.getId().equals(currentUserId))
            .collect(Collectors.toList());
        
        // Get existing connections for current user
        Set<String> connectedUserIds = getConnectedUserIds(currentUserId);
        
        // Calculate scores and filter
        List<UserScore> scoredUsers = allUsers.stream()
            .filter(user -> !connectedUserIds.contains(user.getId()))
            .filter(user -> user.getOnboarding() != null && 
                           user.getOnboarding().isCompleted()) // Only users who completed onboarding
            .filter(user -> user.getProfile() != null) // Only users with profiles
            .map(user -> new UserScore(user, calculateMatchScore(currentUser, user)))
            .sorted((a, b) -> Double.compare(b.getScore(), a.getScore())) // Descending order
            .limit(limit > 0 ? limit : 10) // Default to 10 if limit is 0 or negative
            .collect(Collectors.toList());
        
        // Convert to DTOs
        return scoredUsers.stream()
            .map(us -> convertToUserProfileDto(us.getUser()))
            .collect(Collectors.toList());
    }

    /**
     * Get all user IDs that are connected to the given user.
     */
    private Set<String> getConnectedUserIds(String userId) {
        List<Connection> connections = connectionRepository.findByUser1IdOrUser2Id(userId, userId);
        return connections.stream()
            .map(conn -> conn.getUser1Id().equals(userId) ? conn.getUser2Id() : conn.getUser1Id())
            .collect(Collectors.toSet());
    }

    /**
     * Convert User to UserProfileDto.
     */
    private UserProfileDto convertToUserProfileDto(User user) {
        return UserProfileDto.builder()
            .userId(user.getId())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .email(user.getEmail())
            .profile(user.getProfile())
            .createdAt(user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .build();
    }

    /**
     * Helper class to store user and their match score.
     */
    private static class UserScore {
        private final User user;
        private final double score;

        public UserScore(User user, double score) {
            this.user = user;
            this.score = score;
        }

        public User getUser() {
            return user;
        }

        public double getScore() {
            return score;
        }
    }
}

