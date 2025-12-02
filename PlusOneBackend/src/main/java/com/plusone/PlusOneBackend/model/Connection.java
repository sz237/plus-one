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
@Document(collection = "connections")
@CompoundIndexes({
    @CompoundIndex(name = "user_pair_idx", def = "{ 'user1Id': 1, 'user2Id': 1 }")
})
public class Connection {

    @Id
    private String id;

    @Indexed(name = "user1_idx")
    private String user1Id;         // First user in the connection
    @Indexed(name = "user2_idx")
    private String user2Id;         // Second user in the connection
    private String connectionRequestId; // Reference to the original request
    
    @Builder.Default
    private LocalDateTime connectedAt = LocalDateTime.now();
}
