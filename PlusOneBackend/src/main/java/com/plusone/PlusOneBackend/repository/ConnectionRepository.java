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
        return findByUser1IdAndUser2IdOrUser1IdAndUser2Id(userId1, userId2, userId1, userId2);
    }
    
    // Count total connections for a user
    @Query("{ $or: [ { user1Id: ?0 }, { user2Id: ?0 } ] }")
    int countConnectionsForUser(String userId);
}
