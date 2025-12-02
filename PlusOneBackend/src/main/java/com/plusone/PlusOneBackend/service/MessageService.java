package com.plusone.PlusOneBackend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.plusone.PlusOneBackend.dto.message.ConversationResponse;
import com.plusone.PlusOneBackend.dto.message.MessageResponse;
import com.plusone.PlusOneBackend.dto.message.SendMessageRequest;
import com.plusone.PlusOneBackend.model.Conversation;
import com.plusone.PlusOneBackend.model.Message;
import com.plusone.PlusOneBackend.model.Profile;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.ConversationRepository;
import com.plusone.PlusOneBackend.repository.MessageRepository;
import com.plusone.PlusOneBackend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    private String truncate(String body, int max) {
        if (body == null) return null;
        return body.length() <= max ? body : body.substring(0, max) + "…";
    }

    private List<String> participantKey(String a, String b) {
        return a.compareTo(b) <= 0 ? List.of(a, b) : List.of(b, a);
    }

    private void requireParticipant(Conversation convo, String userId) {
        if (!convo.getParticipantIds().contains(userId)) {
            throw new IllegalArgumentException("User is not part of this conversation");
        }
    }

    private Conversation findOrCreateConversation(String userA, String userB) {
        List<String> key = participantKey(userA, userB);

        Optional<Conversation> existing = conversationRepository.findDirectConversation(key, key.size());
        if (existing.isPresent()) {
            return existing.get();
        }

        Conversation convo = Conversation.builder()
                .participantIds(key)
                .createdAt(Instant.now())
                .lastMessageAt(Instant.now())
                .lastMessagePreview("Say hello")
                .unreadBy(new ArrayList<>())
                .build();

        return conversationRepository.save(convo);
    }

    public List<ConversationResponse> listConversations(String currentUserId) {
        return conversationRepository.findByParticipantIdsContainingOrderByLastMessageAtDesc(currentUserId).stream()
                .map(convo -> toConversationResponse(convo, currentUserId))
                .toList();
    }

    public ConversationResponse openConversation(String currentUserId, String otherUserId) {
        Conversation convo = findOrCreateConversation(currentUserId, otherUserId);
        return toConversationResponse(convo, currentUserId);
    }

    public List<MessageResponse> getMessagesWithUser(String currentUserId, String otherUserId) {
        List<String> key = participantKey(currentUserId, otherUserId);
        Optional<Conversation> convoOpt = conversationRepository.findDirectConversation(key, key.size());
        if (convoOpt.isEmpty()) {
            return List.of();
        }
        Conversation convo = convoOpt.get();
        requireParticipant(convo, currentUserId);

        return fetchMessagesInOrder(convo).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    public MessageResponse sendMessage(String currentUserId, SendMessageRequest request) {
        Conversation convo = resolveConversation(currentUserId, request);

        String recipientId = request.getRecipientId();
        requireParticipant(convo, currentUserId);
        if (!convo.getParticipantIds().contains(recipientId)) {
            throw new IllegalArgumentException("Recipient is not part of this conversation");
        }

        Message message = Message.builder()
                .conversationId(convo.getId())
                .senderId(currentUserId)
                .recipientId(recipientId)
                .body(request.getBody().trim())
                .sentAt(Instant.now())
                .build();

        messageRepository.save(message);

        updateConversationMetadata(convo, message);
        conversationRepository.save(convo);

        return toMessageResponse(message);
    }

    public void markConversationRead(String currentUserId, String conversationId) {
        Conversation convo = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        requireParticipant(convo, currentUserId);

        List<Message> unread = fetchMessagesInOrder(convo).stream()
                .filter(msg -> currentUserId.equals(msg.getRecipientId()) && msg.getReadAt() == null)
                .toList();

        Instant now = Instant.now();
        unread.forEach(msg -> msg.setReadAt(now));
        messageRepository.saveAll(unread);

        convo.getUnreadBy().remove(currentUserId);
        conversationRepository.save(convo);
    }

    private Conversation resolveConversation(String currentUserId, SendMessageRequest request) {
        if (StringUtils.hasText(request.getConversationId())) {
            return conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        }
        return findOrCreateConversation(currentUserId, request.getRecipientId());
    }

    private void updateConversationMetadata(Conversation convo, Message latest) {
        convo.setLastMessageAt(latest.getSentAt());
        convo.setLastMessagePreview(truncate(latest.getBody(), 80));

        convo.getUnreadBy().remove(latest.getSenderId());
        if (!convo.getUnreadBy().contains(latest.getRecipientId())) {
            convo.getUnreadBy().add(latest.getRecipientId());
        }
    }

    private List<Message> fetchMessagesInOrder(Conversation convo) {
        return messageRepository.findByConversationIdOrderBySentAtAsc(convo.getId());
    }

    private ConversationResponse toConversationResponse(Conversation convo, String currentUserId) {
        String otherId = convo.getParticipantIds().stream()
                .filter(id -> !id.equals(currentUserId))
                .findFirst()
                .orElse(currentUserId);

        User other = userRepository.findById(otherId).orElse(null);

        return ConversationResponse.builder()
                .conversationId(convo.getId())
                .otherUserId(otherId)
                .otherUserName(displayName(other))
                .otherUserPhotoUrl(profilePhotoUrl(other))
                .lastMessagePreview(convo.getLastMessagePreview())
                .lastMessageAt(convo.getLastMessageAt())
                .hasUnread(convo.getUnreadBy().contains(currentUserId))
                .build();
    }

    private MessageResponse toMessageResponse(Message message) {
        User sender = userRepository.findById(message.getSenderId()).orElse(null);

        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .senderId(message.getSenderId())
                .senderName(displayName(sender))
                .senderProfilePicUrl(profilePhotoUrl(sender))
                .recipientId(message.getRecipientId())
                .body(message.getBody())
                .sentAt(message.getSentAt())
                .readAt(message.getReadAt())
                .build();
    }

    private String displayName(User user) {
        if (user == null) {
            return "Unknown";
        }
        String first = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String last = user.getLastName() != null ? user.getLastName().trim() : "";
        String combined = (first + " " + last).trim();
        return combined.isEmpty() ? "Unknown" : combined;
    }

    private String profilePhotoUrl(User user) {
        if (user == null) {
            return null;
        }
        Profile profile = user.getProfile();
        if (profile == null) {
            return null;
        }
        Profile.Photo photo = profile.getProfilePhoto();
        return photo != null ? photo.getUrl() : null;
    }
}
