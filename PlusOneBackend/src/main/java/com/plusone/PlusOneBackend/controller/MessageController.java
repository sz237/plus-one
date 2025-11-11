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

    private String resolveUser(String header) {
        if (header == null || header.isBlank()) {
            throw new IllegalArgumentException("Missing X-User-Id header (replace with real auth)");
        }
        return header;
    }

    @GetMapping("/conversations")
    public List<ConversationResponse> listConversations(
            @RequestHeader("X-User-Id") String userId) {
        return messageService.listConversations(resolveUser(userId));
    }

    @PostMapping("/conversations/{otherUserId}")
    public ConversationResponse openConversation(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String otherUserId) {
        return messageService.openConversation(resolveUser(userId), otherUserId);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<MessageResponse> getMessages(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String conversationId) {
        return messageService.getMessages(resolveUser(userId), conversationId);
    }

    @PatchMapping("/conversations/{conversationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String conversationId) {
        messageService.markConversationRead(resolveUser(userId), conversationId);
    }

    @PostMapping
    public MessageResponse sendMessage(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody @Valid SendMessageRequest request) {
        return messageService.sendMessage(resolveUser(userId), request);
    }
}