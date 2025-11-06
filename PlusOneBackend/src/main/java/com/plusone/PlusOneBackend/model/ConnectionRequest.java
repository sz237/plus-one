package com.plusone.PlusOneBackend.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "connection_requests")
public class ConnectionRequest {

    @Id
    private String id;

    private String fromUserId;      // User who sent the request
    private String toUserId;        // User who received the request
    private String message;         // Message field (required)
    private String status;          // "PENDING", "ACCEPTED", "REJECTED"
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
