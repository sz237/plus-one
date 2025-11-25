package com.plusone.PlusOneBackend.dto.message;

import java.time.Instant;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class MessageResponse {
    String id;
    String conversationId;
    String senderMessengerId;
    String senderName;
    String senderProfilePicUrl;
    String recipientMessengerId;
    String body;
    Instant sentAt;
    Instant readAt;
}
