package com.plusone.PlusOneBackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.IndexResolver;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

/**
 * MongoDB Index Configuration
 * 
 * This class automatically creates indexes on frequently queried fields
 * to improve query performance. Indexes are created on application startup.
 */
@Configuration
@RequiredArgsConstructor
public class MongoIndexConfig {

    private final MongoTemplate mongoTemplate;
    private final MongoMappingContext mongoMappingContext;

    @PostConstruct
    public void createIndexes() {
        // Connection indexes - critical for connection queries
        IndexOperations connectionOps = mongoTemplate.indexOps("connections");
        connectionOps.ensureIndex(new Index().on("user1Id", org.springframework.data.domain.Sort.Direction.ASC));
        connectionOps.ensureIndex(new Index().on("user2Id", org.springframework.data.domain.Sort.Direction.ASC));
        // Compound index for findByUser1IdOrUser2Id queries
        connectionOps.ensureIndex(new Index().on("user1Id", org.springframework.data.domain.Sort.Direction.ASC)
                .on("user2Id", org.springframework.data.domain.Sort.Direction.ASC));

        // ConnectionRequest indexes - critical for request queries
        IndexOperations requestOps = mongoTemplate.indexOps("connection_requests");
        requestOps.ensureIndex(new Index().on("fromUserId", org.springframework.data.domain.Sort.Direction.ASC));
        requestOps.ensureIndex(new Index().on("toUserId", org.springframework.data.domain.Sort.Direction.ASC));
        requestOps.ensureIndex(new Index().on("status", org.springframework.data.domain.Sort.Direction.ASC));
        // Compound indexes for common query patterns
        requestOps.ensureIndex(new Index().on("fromUserId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("status", org.springframework.data.domain.Sort.Direction.ASC));
        requestOps.ensureIndex(new Index().on("toUserId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("status", org.springframework.data.domain.Sort.Direction.ASC));
        requestOps.ensureIndex(new Index().on("fromUserId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("toUserId", org.springframework.data.domain.Sort.Direction.ASC));

        // User indexes - for search and location queries
        IndexOperations userOps = mongoTemplate.indexOps("users");
        userOps.ensureIndex(new Index().on("firstName", org.springframework.data.domain.Sort.Direction.ASC));
        userOps.ensureIndex(new Index().on("lastName", org.springframework.data.domain.Sort.Direction.ASC));
        userOps.ensureIndex(new Index().on("profile.location.city", org.springframework.data.domain.Sort.Direction.ASC));
        userOps.ensureIndex(new Index().on("profile.interests", org.springframework.data.domain.Sort.Direction.ASC));
        userOps.ensureIndex(new Index().on("profile.lookingForRoommate", org.springframework.data.domain.Sort.Direction.ASC));

        // Post indexes - for category and date queries
        IndexOperations postOps = mongoTemplate.indexOps("posts");
        postOps.ensureIndex(new Index().on("category", org.springframework.data.domain.Sort.Direction.ASC));
        postOps.ensureIndex(new Index().on("userId", org.springframework.data.domain.Sort.Direction.ASC));
        // Compound index for findByCategoryIgnoreCaseOrderByCreatedAtDesc
        postOps.ensureIndex(new Index().on("category", org.springframework.data.domain.Sort.Direction.ASC)
                .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC));
        // Index for user's posts
        postOps.ensureIndex(new Index().on("userId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC));

        // Message indexes - for conversation queries
        IndexOperations messageOps = mongoTemplate.indexOps("messages");
        messageOps.ensureIndex(new Index().on("conversationId", org.springframework.data.domain.Sort.Direction.ASC));
        // Compound index for findByConversationIdOrderBySentAtAsc
        messageOps.ensureIndex(new Index().on("conversationId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("sentAt", org.springframework.data.domain.Sort.Direction.ASC));

        // Conversation indexes
        IndexOperations conversationOps = mongoTemplate.indexOps("conversations");
        conversationOps.ensureIndex(new Index().on("user1Id", org.springframework.data.domain.Sort.Direction.ASC));
        conversationOps.ensureIndex(new Index().on("user2Id", org.springframework.data.domain.Sort.Direction.ASC));
    }
}

