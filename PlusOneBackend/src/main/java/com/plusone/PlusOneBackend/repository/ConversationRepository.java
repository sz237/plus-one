package com.plusone.PlusOneBackend.repository;


import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.plusone.PlusOneBackend.model.Conversation;

public interface ConversationRepository extends MongoRepository<Conversation, String> {

    List<Conversation> findByParticipantIdsContaining(String userId);

    @Query("{ 'participantIds': { $all: ?0 }, 'participantIds': { $size: ?1 } }")
    Optional<Conversation> findDirectConversation(List<String> participants, int size);
}