package com.plusone.PlusOneBackend.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

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
    @Field("participantIds")
    private List<String> participantMessengerIds = new ArrayList<>();

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant lastMessageAt = Instant.now();

    private String lastMessagePreview;

    @Builder.Default
    @Field("unreadBy")
    private List<String> unreadByMessengerIds = new ArrayList<>();

    @Builder.Default
    @Field("lastReadAt")
    private Map<String, Instant> lastReadAt = Map.of();
}
