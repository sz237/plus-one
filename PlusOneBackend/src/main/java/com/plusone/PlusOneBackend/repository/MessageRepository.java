package com.plusone.PlusOneBackend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.plusone.PlusOneBackend.model.Message;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByConversationIdOrderBySentAtAsc(String conversationId);
}
