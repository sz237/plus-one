package com.plusone.PlusOneBackend.service;

import com.plusone.PlusOneBackend.dto.ConnectionRequestDto;
import com.plusone.PlusOneBackend.dto.CreateConnectionRequestDto;
import com.plusone.PlusOneBackend.dto.UserProfileDto;
import com.plusone.PlusOneBackend.model.Connection;
import com.plusone.PlusOneBackend.model.ConnectionRequest;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.ConnectionRepository;
import com.plusone.PlusOneBackend.repository.ConnectionRequestRepository;
import com.plusone.PlusOneBackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ConnectionService {

    @Autowired
    private ConnectionRequestRepository connectionRequestRepository;

    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;
    
    @Autowired
    private MatchingService matchingService;

    /**
     * Retrieves ranked users based on location and interests matching.
     * Users are ranked by match score (location priority = 3, interests priority = 2).
     * 
     * @param currentUserId The ID of the current user
     * @param limit Maximum number of users to return (use a large number like 1000 for all users)
     */
    public List<UserProfileDto> getRecentUsers(String currentUserId, Integer limit) {
        // Use matching service to get ranked users
        // If limit is null or <= 0, use a very large number to get all users
        int actualLimit = (limit != null && limit > 0) ? limit : Integer.MAX_VALUE;
        return matchingService.getRankedUsers(currentUserId, actualLimit);
    }

    /**
     * Get suggested users (excluding friends) sorted by match algorithm.
     * 
     * @param currentUserId The ID of the current user
     * @param limit Maximum number of users to return
     */
    public List<UserProfileDto> getSuggestedUsers(String currentUserId, Integer limit) {
        int actualLimit = (limit != null && limit > 0) ? limit : 10000;
        return matchingService.getSuggestedUsers(currentUserId, actualLimit);
    }

    /**
     * Get all friends (connected users) for the current user.
     * Sorted arbitrarily (by creation date).
     * 
     * @param currentUserId The ID of the current user
     */
    public List<UserProfileDto> getFriends(String currentUserId) {
        // Get all connections for the user
        List<Connection> connections = connectionRepository.findByUser1IdOrUser2Id(currentUserId, currentUserId);
        
        // Extract friend user IDs
        Set<String> friendIds = connections.stream()
            .map(conn -> conn.getUser1Id().equals(currentUserId) ? conn.getUser2Id() : conn.getUser1Id())
            .collect(Collectors.toSet());
        
        // Get user objects for friends
        List<User> friends = userRepository.findAllById(friendIds);
        
        // Convert to DTOs and sort by creation date (arbitrary)
        return friends.stream()
            .sorted((u1, u2) -> u2.getCreatedAt().compareTo(u1.getCreatedAt())) // Most recent first
            .map(this::convertToUserProfileDto)
            .collect(Collectors.toList());
    }

    /**
     * Create a connection request
     */
    public ConnectionRequestDto createConnectionRequest(String fromUserId, CreateConnectionRequestDto request) {
        // Validate users exist
        Optional<User> fromUser = userRepository.findById(fromUserId);
        Optional<User> toUser = userRepository.findById(request.getToUserId());
        
        if (fromUser.isEmpty() || toUser.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        // Check if users are already connected
        if (areUsersConnected(fromUserId, request.getToUserId())) {
            throw new RuntimeException("Users are already connected");
        }

        // Check if there's already a pending request
        Optional<ConnectionRequest> existingRequest = connectionRequestRepository
            .findByFromUserIdAndToUserId(fromUserId, request.getToUserId());
        
        if (existingRequest.isPresent() && "PENDING".equals(existingRequest.get().getStatus())) {
            throw new RuntimeException("Connection request already pending");
        }

        // Create new request
        ConnectionRequest connectionRequest = ConnectionRequest.builder()
            .fromUserId(fromUserId)
            .toUserId(request.getToUserId())
            .message(request.getMessage())
            .status("PENDING")
            .build();

        ConnectionRequest savedRequest = connectionRequestRepository.save(connectionRequest);

        // Send email notification to the recipient
        emailService.sendConnectionRequestNotification(
            toUser.get().getEmail(),
            toUser.get().getFirstName(),
            fromUser.get().getFirstName() + " " + fromUser.get().getLastName(),
            request.getMessage()
        );

        return convertToConnectionRequestDto(savedRequest);
    }

    /**
     * Accept connection request
     */
    public ConnectionRequestDto acceptConnectionRequest(String requestId, String userId) {
        Optional<ConnectionRequest> requestOpt = connectionRequestRepository.findById(requestId);
        
        if (requestOpt.isEmpty()) {
            throw new RuntimeException("Connection request not found");
        }

        ConnectionRequest request = requestOpt.get();
        
        // Verify the user is the recipient
        if (!request.getToUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to accept this request");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Request is not pending");
        }

        // Update request status
        request.setStatus("ACCEPTED");
        ConnectionRequest savedRequest = connectionRequestRepository.save(request);

        // Create connection
        Connection connection = Connection.builder()
            .user1Id(request.getFromUserId())
            .user2Id(request.getToUserId())
            .connectionRequestId(requestId)
            .build();
        
        connectionRepository.save(connection);

        // Send email notification to the requester of connection acceptance
        Optional<User> fromUser = userRepository.findById(request.getFromUserId());
        Optional<User> toUser = userRepository.findById(request.getToUserId());
        
        if (fromUser.isPresent() && toUser.isPresent()) {
            emailService.sendConnectionAcceptedNotification(
                fromUser.get().getEmail(),
                fromUser.get().getFirstName(),
                toUser.get().getFirstName() + " " + toUser.get().getLastName()
            );
        }

        return convertToConnectionRequestDto(savedRequest);
    }

    /**
     * Check if two users are connected
     */
    public boolean areUsersConnected(String userId1, String userId2) {
        return connectionRepository.findConnectionBetweenUsers(userId1, userId2).isPresent();
    }

    /**
     * Get connection status between two users
     */
    public String getConnectionStatus(String fromUserId, String toUserId) {
        // Check if already connected
        if (areUsersConnected(fromUserId, toUserId)) {
            return "FRIENDS";
        }

        // Check if there's a pending request
        Optional<ConnectionRequest> request = connectionRequestRepository
            .findByFromUserIdAndToUserId(fromUserId, toUserId);
        
        if (request.isPresent() && "PENDING".equals(request.get().getStatus())) {
            return "PENDING";
        }

        return "CONNECT";
    }

    /**
     * Get pending connection requests for a user
     */
    public List<ConnectionRequestDto> getPendingRequests(String userId) {
        List<ConnectionRequest> requests = connectionRequestRepository
            .findByToUserIdAndStatus(userId, "PENDING");
        
        return requests.stream()
            .map(this::convertToConnectionRequestDto)
            .collect(Collectors.toList());
    }

    /**
     * Reject a connection request
     */
    public ConnectionRequestDto rejectConnectionRequest(String requestId, String userId) {
        Optional<ConnectionRequest> requestOpt = connectionRequestRepository.findById(requestId);
        
        if (requestOpt.isEmpty()) {
            throw new RuntimeException("Connection request not found");
        }

        ConnectionRequest request = requestOpt.get();
        
        // Verify the user is the recipient
        if (!request.getToUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to reject this request");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Request is not pending");
        }

        // Update request status
        request.setStatus("REJECTED");
        ConnectionRequest savedRequest = connectionRequestRepository.save(request);

        return convertToConnectionRequestDto(savedRequest);
    }

    private UserProfileDto convertToUserProfileDto(User user) {
        return UserProfileDto.builder()
            .userId(user.getId())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .email(user.getEmail())
            .messengerId(user.getMessengerId())
            .profile(user.getProfile())
            .createdAt(user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .build();
    }

    private ConnectionRequestDto convertToConnectionRequestDto(ConnectionRequest request) {
        return ConnectionRequestDto.builder()
            .id(request.getId())
            .fromUserId(request.getFromUserId())
            .toUserId(request.getToUserId())
            .message(request.getMessage())
            .status(request.getStatus())
            .createdAt(request.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .updatedAt(request.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .build();
    }
}
