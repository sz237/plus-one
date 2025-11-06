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

    /**
     * Retrieves 3 users from recent signups; arbitrary for now
     */
    public List<UserProfileDto> getRecentUsers(String currentUserId) {
        List<User> users = userRepository.findAll()
            .stream()
            .filter(user -> !user.getId().equals(currentUserId)) // Exclude current user
            .sorted((u1, u2) -> u2.getCreatedAt().compareTo(u1.getCreatedAt())) // (arbitrary decision)
            .limit(3)
            .collect(Collectors.toList());

        return users.stream()
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
