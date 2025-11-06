package com.plusone.PlusOneBackend.controller;

import com.plusone.PlusOneBackend.dto.ConnectionRequestDto;
import com.plusone.PlusOneBackend.dto.CreateConnectionRequestDto;
import com.plusone.PlusOneBackend.dto.UserProfileDto;
import com.plusone.PlusOneBackend.service.ConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/connections")
@CrossOrigin(origins = "http://localhost:5173")
public class ConnectionController {

    @Autowired
    private ConnectionService connectionService;

    /**
     * Get recent users for homepage display
     */
    @GetMapping("/recent-users")
    public ResponseEntity<List<UserProfileDto>> getRecentUsers(@RequestParam String currentUserId) {
        try {
            List<UserProfileDto> users = connectionService.getRecentUsers(currentUserId);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Create a connection request
     */
    @PostMapping("/request")
    public ResponseEntity<ConnectionRequestDto> createConnectionRequest(
            @RequestParam String fromUserId,
            @RequestBody CreateConnectionRequestDto request) {
        try {
            ConnectionRequestDto result = connectionService.createConnectionRequest(fromUserId, request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Accept a connection request
     */
    @PostMapping("/accept/{requestId}")
    public ResponseEntity<ConnectionRequestDto> acceptConnectionRequest(
            @PathVariable String requestId,
            @RequestParam String userId) {
        try {
            ConnectionRequestDto result = connectionService.acceptConnectionRequest(requestId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
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
    public ResponseEntity<ConnectionRequestDto> rejectConnectionRequest(
            @PathVariable String requestId,
            @RequestParam String userId) {
        try {
            ConnectionRequestDto result = connectionService.rejectConnectionRequest(requestId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
