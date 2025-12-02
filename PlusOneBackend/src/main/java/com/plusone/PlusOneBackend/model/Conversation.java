package com.plusone.PlusOneBackend.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
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
@CompoundIndexes({
    @CompoundIndex(name = "participants_last_idx", def = "{ 'participantIds': 1, 'lastMessageAt': -1 }")
})
public class Conversation {

    @Id 
    private String id;

    @Indexed(name = "participant_ids_idx")
    @Builder.Default
    private List<String> participantIds = new ArrayList<>();

    @Builder.Default
    private List<String> messageIds = new ArrayList<>();

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Indexed(name = "last_message_at_idx")
    @Builder.Default
    private Instant lastMessageAt = Instant.now();

    private String lastMessagePreview;

    @Builder.Default
    private List<String> unreadBy = new ArrayList<>();

    @Builder.Default
    private Map<String, Instant> lastReadAt = Map.of();
}
