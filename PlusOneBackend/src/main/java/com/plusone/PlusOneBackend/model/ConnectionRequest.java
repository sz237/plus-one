package com.plusone.PlusOneBackend.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
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
@CompoundIndexes({
    @CompoundIndex(name = "to_status_idx", def = "{ 'toUserId': 1, 'status': 1 }"),
    @CompoundIndex(name = "from_status_idx", def = "{ 'fromUserId': 1, 'status': 1 }")
})
public class ConnectionRequest {

    @Id
    private String id;

    @Indexed(name = "from_user_idx")
    private String fromUserId;      // User who sent the request
    @Indexed(name = "to_user_idx")
    private String toUserId;        // User who received the request
    private String message;         // Message field (required)
    private String status;          // "PENDING", "ACCEPTED", "REJECTED"
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
