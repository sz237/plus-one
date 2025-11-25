package com.plusone.PlusOneBackend.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.plusone.PlusOneBackend.model.Message;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByConversationIdOrderBySentAtAsc(String conversationId);

    long countByConversationIdAndRecipientMessengerIdAndReadAtIsNull(String conversationId, String recipientMessengerId);

    List<Message> findByConversationIdAndRecipientMessengerIdAndReadAtIsNull(String conversationId, String recipientMessengerId);

    long countByConversationIdAndSentAtAfter(String conversationId, Instant sentAt);
}
