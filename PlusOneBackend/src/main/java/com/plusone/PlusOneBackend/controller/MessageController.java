package com.plusone.PlusOneBackend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.util.StringUtils;

import com.plusone.PlusOneBackend.dto.message.ConversationResponse;
import com.plusone.PlusOneBackend.dto.message.MessageResponse;
import com.plusone.PlusOneBackend.dto.message.SendMessageRequest;
import com.plusone.PlusOneBackend.service.MessageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Validated
public class MessageController {

    private final MessageService messageService;

    private String resolveUser(String messengerIdHeader, String userIdHeader) {
        if (StringUtils.hasText(messengerIdHeader)) {
            return messengerIdHeader.trim();
        }
        if (StringUtils.hasText(userIdHeader)) {
            return userIdHeader.trim();
        }
        throw new IllegalArgumentException("Missing X-Messenger-Id/X-User-Id header (replace with real auth)");
    }

    @GetMapping("/conversations")
    public List<ConversationResponse> listConversations(
            @RequestHeader(value = "X-Messenger-Id", required = false) String messengerId,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return messageService.listConversations(resolveUser(messengerId, userId));
    }

    @PostMapping("/conversations/{otherUserId}")
    public ConversationResponse openConversation(
            @RequestHeader(value = "X-Messenger-Id", required = false) String messengerId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable("otherUserId") String otherMessengerId) {
        return messageService.openConversation(resolveUser(messengerId, userId), otherMessengerId);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<MessageResponse> getMessages(
            @RequestHeader(value = "X-Messenger-Id", required = false) String messengerId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String conversationId) {
        return messageService.getMessages(resolveUser(messengerId, userId), conversationId);
    }

    @PatchMapping("/conversations/{conversationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(
            @RequestHeader(value = "X-Messenger-Id", required = false) String messengerId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String conversationId) {
        messageService.markConversationRead(resolveUser(messengerId, userId), conversationId);
    }

    @PostMapping
    public MessageResponse sendMessage(
            @RequestHeader(value = "X-Messenger-Id", required = false) String messengerId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody @Valid SendMessageRequest request) {
        return messageService.sendMessage(resolveUser(messengerId, userId), request);
    }
}
