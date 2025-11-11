package com.plusone.PlusOneBackend.controller;

import com.plusone.PlusOneBackend.dto.ConnectionRequestDto;
import com.plusone.PlusOneBackend.dto.CreateConnectionRequestDto;
import com.plusone.PlusOneBackend.dto.UserProfileDto;
import com.plusone.PlusOneBackend.service.ConnectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/connections")
public class ConnectionController {

    private static final Logger logger = LoggerFactory.getLogger(ConnectionController.class);

    @Autowired
    private ConnectionService connectionService;

    /**
     * Get recent users for homepage display
     */
    @GetMapping("/recent-users")
    public ResponseEntity<List<UserProfileDto>> getRecentUsers(
            @RequestParam String currentUserId,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        try {
            List<UserProfileDto> users = connectionService.getRecentUsers(currentUserId, limit);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get suggested users (excluding friends) sorted by match algorithm
     */
    @GetMapping("/suggested-users")
    public ResponseEntity<List<UserProfileDto>> getSuggestedUsers(
            @RequestParam String currentUserId,
            @RequestParam(required = false, defaultValue = "10000") Integer limit) {
        try {
            List<UserProfileDto> users = connectionService.getSuggestedUsers(currentUserId, limit);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error getting suggested users: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all friends (connected users) for the current user
     */
    @GetMapping("/friends")
    public ResponseEntity<List<UserProfileDto>> getFriends(@RequestParam String currentUserId) {
        try {
            List<UserProfileDto> friends = connectionService.getFriends(currentUserId);
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            logger.error("Error getting friends: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Create a connection request
     */
    @PostMapping("/request")
    public ResponseEntity<?> createConnectionRequest(
            @RequestParam String fromUserId,
            @RequestBody CreateConnectionRequestDto request) {
        try {
            logger.info("Creating connection request: fromUserId={}, toUserId={}", 
                    fromUserId, request.getToUserId());
            ConnectionRequestDto result = connectionService.createConnectionRequest(fromUserId, request);
            logger.info("Successfully created connection request: fromUserId={}, toUserId={}", 
                    fromUserId, request.getToUserId());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            logger.error("Error creating connection request: fromUserId={}, toUserId={}, error={}", 
                    fromUserId, request.getToUserId(), e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            logger.error("Unexpected error creating connection request: fromUserId={}, toUserId={}", 
                    fromUserId, request.getToUserId(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Accept a connection request
     */
    @PostMapping("/accept/{requestId}")
    public ResponseEntity<?> acceptConnectionRequest(
            @PathVariable String requestId,
            @RequestParam String userId) {
        try {
            logger.info("Accepting connection request: requestId={}, userId={}", requestId, userId);
            ConnectionRequestDto result = connectionService.acceptConnectionRequest(requestId, userId);
            logger.info("Successfully accepted connection request: requestId={}", requestId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            logger.error("Error accepting connection request: requestId={}, userId={}, error={}", 
                    requestId, userId, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            logger.error("Unexpected error accepting connection request: requestId={}, userId={}", 
                    requestId, userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get connection status between two users
     */
    @GetMapping("/status")
    public ResponseEntity<String> getConnectionStatus(
            @RequestParam String fromUserId,
            @RequestParam String toUserId) {
        try {
            String status = connectionService.getConnectionStatus(fromUserId, toUserId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get pending connection requests for a user
     */
    @GetMapping("/pending-requests")
    public ResponseEntity<List<ConnectionRequestDto>> getPendingRequests(@RequestParam String userId) {
        try {
            List<ConnectionRequestDto> requests = connectionService.getPendingRequests(userId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Reject a connection request
     */
    @PostMapping("/reject/{requestId}")
    public ResponseEntity<?> rejectConnectionRequest(
            @PathVariable String requestId,
            @RequestParam String userId) {
        try {
            logger.info("Rejecting connection request: requestId={}, userId={}", requestId, userId);
            ConnectionRequestDto result = connectionService.rejectConnectionRequest(requestId, userId);
            logger.info("Successfully rejected connection request: requestId={}", requestId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            logger.error("Error rejecting connection request: requestId={}, userId={}, error={}", 
                    requestId, userId, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            logger.error("Unexpected error rejecting connection request: requestId={}, userId={}", 
                    requestId, userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
