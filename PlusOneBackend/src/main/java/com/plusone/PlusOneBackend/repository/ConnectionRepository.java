package com.plusone.PlusOneBackend.repository;

import com.plusone.PlusOneBackend.model.Connection;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends MongoRepository<Connection, String> {
    
    // Find all connections for a user
    List<Connection> findByUser1IdOrUser2Id(String user1Id, String user2Id);
    
    // Check if two users are connected
    Optional<Connection> findByUser1IdAndUser2IdOrUser1IdAndUser2Id(
        String user1Id, String user2Id, String user2Id2, String user1Id2);
    
    // Find specific connection between two users
    default Optional<Connection> findConnectionBetweenUsers(String userId1, String userId2) {
        // Check both directions (A-B or B-A)
        return findByUser1IdAndUser2IdOrUser1IdAndUser2Id(userId1, userId2, userId2, userId1);
    }
    
    // Count total connections for a user (convenience method)
    default int countConnectionsForUser(String userId) {
        // Use the existing findByUser1IdOrUser2Id method and count results
        // This is more reliable than custom count queries
        List<Connection> connections = findByUser1IdOrUser2Id(userId, userId);
        return connections != null ? connections.size() : 0;
    }
}
