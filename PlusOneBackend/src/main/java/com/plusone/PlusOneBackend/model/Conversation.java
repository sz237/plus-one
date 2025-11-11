package com.plusone.PlusOneBackend.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * High-level metadata for a messaging thread.
 * Lets us render an inbox without scanning every message.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "conversations")
public class Conversation {

    @Id 
    private String id;

    @Builder.Default
    private List<String> participantIds = new ArrayList<>();

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant lastMessageAt = Instant.now();

    private String lastMessagePreview;

    @Builder.Default
    private List<String> unreadBy = new ArrayList<>();

    @Builder.Default
    private Map<String, Instant> lastReadAt = Map.of();
}