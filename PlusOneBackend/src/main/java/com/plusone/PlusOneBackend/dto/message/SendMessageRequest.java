package com.plusone.PlusOneBackend.dto.message;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {

    private String conversationId;

    @NotBlank
    private String recipientId;

    @NotBlank
    private String body;
}

