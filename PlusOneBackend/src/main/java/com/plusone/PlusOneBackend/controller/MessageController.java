package com.plusone.PlusOneBackend.controller;

import java.util.List;
import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.plusone.PlusOneBackend.dto.message.ConversationResponse;
import com.plusone.PlusOneBackend.dto.message.MessageResponse;
import com.plusone.PlusOneBackend.dto.message.SendMessageRequest;
import com.plusone.PlusOneBackend.service.MessageService;
import com.plusone.PlusOneBackend.service.realtime.SseService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Validated
public class MessageController {

    private final MessageService messageService;
    private final SseService sseService;

    private String currentUserId(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("Unauthorized");
        }
        return principal.getName();
    }

    @GetMapping("/conversations")
    public List<ConversationResponse> listConversations(
            Principal principal) {
        return messageService.listConversations(currentUserId(principal));
    }

    @GetMapping("/with/{otherUserId}")
    public List<MessageResponse> getMessagesWithUser(
            Principal principal,
            @PathVariable String otherUserId) {
        return messageService.getMessagesWithUser(currentUserId(principal), otherUserId);
    }

    @PostMapping("/conversations/{otherUserId}")
    public ConversationResponse openConversation(
            Principal principal,
            @PathVariable String otherUserId) {
        return messageService.openConversation(currentUserId(principal), otherUserId);
    }

    @PatchMapping("/conversations/{conversationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(
            Principal principal,
            @PathVariable String conversationId) {
        messageService.markConversationRead(currentUserId(principal), conversationId);
    }

    @PostMapping
    public MessageResponse sendMessage(
            Principal principal,
            @RequestBody @Valid SendMessageRequest request) {
        return messageService.sendMessage(currentUserId(principal), request);
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            Principal principal,
            @RequestParam(value = "heartbeat", required = false) String heartbeat) {
        return sseService.subscribe(currentUserId(principal));
    }
}
