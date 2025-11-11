package com.plusone.PlusOneBackend.model;
import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single chat message between two participants. Stored in the "messages"
 * collection so we can query per conversation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "messages")
public class Message {

    @Id 
    private String id;

    private String conversationId;
    private String senderId;
    private String recipientId;

    private String body;

    @Builder.Default
    private Instant sentAt = Instant.now();

    private Instant readAt;
}