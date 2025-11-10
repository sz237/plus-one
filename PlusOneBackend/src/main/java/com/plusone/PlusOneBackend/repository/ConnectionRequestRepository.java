package com.plusone.PlusOneBackend.repository;

import com.plusone.PlusOneBackend.model.ConnectionRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRequestRepository extends MongoRepository<ConnectionRequest, String> {
    
    // Find pending requests sent by a user
    List<ConnectionRequest> findByFromUserIdAndStatus(String fromUserId, String status);
    
    // Find pending requests received by a user
    List<ConnectionRequest> findByToUserIdAndStatus(String toUserId, String status);
    
    // Find specific request between two users
    Optional<ConnectionRequest> findByFromUserIdAndToUserId(String fromUserId, String toUserId);
    
    // Find all requests involving a user
    List<ConnectionRequest> findByFromUserIdOrToUserId(String fromUserId, String toUserId);
    
    // Count pending requests for a user
    int countByToUserIdAndStatus(String toUserId, String status);
    
    // Count accepted connection requests where user is either sender or receiver
    // This counts all ACCEPTED requests where the user is involved
    default int countAcceptedConnectionsForUser(String userId) {
        // Count where user is the sender and status is ACCEPTED
        int sentAndAccepted = countByFromUserIdAndStatus(userId, "ACCEPTED");
        // Count where user is the receiver and status is ACCEPTED
        int receivedAndAccepted = countByToUserIdAndStatus(userId, "ACCEPTED");
        return sentAndAccepted + receivedAndAccepted;
    }
    
    // Helper method to count by fromUserId and status
    int countByFromUserIdAndStatus(String fromUserId, String status);
}
