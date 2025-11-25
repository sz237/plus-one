package com.plusone.PlusOneBackend.dto.message;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.util.StringUtils;

@Data
public class SendMessageRequest {

    private String conversationId;

    /**
     * Canonical messenger identifier for the other participant.
     * Kept separate from the legacy recipientId to maintain backwards compatibility.
     */
    @JsonProperty("recipientMessengerId")
    private String recipientMessengerId;

    @JsonProperty("recipientId")
    private String legacyRecipientId;

    @NotBlank
    private String body;

    public String resolveRecipientMessengerId() {
        if (StringUtils.hasText(recipientMessengerId)) {
            return recipientMessengerId.trim();
        }
        if (StringUtils.hasText(legacyRecipientId)) {
            return legacyRecipientId.trim();
        }
        throw new IllegalArgumentException("recipientMessengerId is required");
    }
}
