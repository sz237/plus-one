package com.plusone.PlusOneBackend.dto.message;

import java.time.Instant;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class MessageResponse {
    String id;
    String conversationId;
    String senderId;
    String senderName;
    String senderProfilePicUrl;
    String recipientId;
    String body;
    Instant sentAt;
    Instant readAt;
}