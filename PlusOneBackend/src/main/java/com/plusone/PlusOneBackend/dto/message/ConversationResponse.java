package com.plusone.PlusOneBackend.dto.message;

import java.time.Instant;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ConversationResponse {
    String conversationId;
    String otherUserId;
    String otherUserName;
    String otherUserPhotoUrl;
    String lastMessagePreview;
    Instant lastMessageAt;
    boolean hasUnread;
}