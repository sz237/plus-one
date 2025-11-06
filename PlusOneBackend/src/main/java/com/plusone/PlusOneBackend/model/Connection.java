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
@Document(collection = "connections")
public class Connection {

    @Id
    private String id;

    private String user1Id;         // First user in the connection
    private String user2Id;         // Second user in the connection
    private String connectionRequestId; // Reference to the original request
    
    @Builder.Default
    private LocalDateTime connectedAt = LocalDateTime.now();
}
