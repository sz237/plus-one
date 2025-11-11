package com.plusone.PlusOneBackend.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.plusone.PlusOneBackend.model.Message;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByConversationIdOrderBySentAtAsc(String conversationId);

    long countByConversationIdAndRecipientIdAndReadAtIsNull(String conversationId, String recipientId);

    List<Message> findByConversationIdAndRecipientIdAndReadAtIsNull(String conversationId, String recipientId);

    long countByConversationIdAndSentAtAfter(String conversationId, Instant sentAt);
}

