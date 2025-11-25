package com.plusone.PlusOneBackend.service;

import static java.util.Comparator.comparing;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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
    private final MessengerIdService messengerIdService;

    private String truncate(String body, int max) {
        if (body == null) return null;
        return body.length() <= max ? body : body.substring(0, max) + "…";
    }

    private List<String> participantKey(String a, String b) {
        return a.compareTo(b) <= 0 ? List.of(a, b) : List.of(b, a);
    }

    private User loadUser(String identifier) {
        return findUser(identifier)
            .orElseThrow(() -> new IllegalArgumentException("User not found for identifier: " + identifier));
    }

    private Optional<User> findUser(String identifier) {
        if (!StringUtils.hasText(identifier)) {
            return Optional.empty();
        }
        String trimmed = identifier.trim();
        Optional<User> byMessenger = userRepository.findByMessengerId(trimmed.toLowerCase());
        if (byMessenger.isPresent()) {
            return byMessenger;
        }
        return userRepository.findById(trimmed);
    }

    private String ensureMessengerId(User user) {
        return messengerIdService.ensureMessengerId(user).toLowerCase();
    }

    private void requireParticipant(Conversation convo, String messengerId) {
        if (!convo.getParticipantMessengerIds().contains(messengerId)) {
            throw new IllegalArgumentException("User is not part of this conversation");
        }
    }

    private String normalizeParticipant(String identifier) {
        if (!StringUtils.hasText(identifier)) {
            return identifier;
        }
        String trimmed = identifier.trim();
        Optional<User> user = findUser(trimmed);
        if (user.isPresent()) {
            return ensureMessengerId(user.get());
        }
        return trimmed.toLowerCase();
    }

    private Conversation normalizeConversationParticipants(Conversation convo) {
        List<String> participants = convo.getParticipantMessengerIds() != null
                ? convo.getParticipantMessengerIds()
                : new ArrayList<>();

        List<String> normalizedParticipants = participants.stream()
                .map(this::normalizeParticipant)
                .collect(Collectors.toCollection(ArrayList::new));

        List<String> unread = convo.getUnreadByMessengerIds() != null
                ? convo.getUnreadByMessengerIds()
                : new ArrayList<>();

        List<String> normalizedUnread = unread.stream()
                .map(this::normalizeParticipant)
                .collect(Collectors.toCollection(ArrayList::new));

        Map<String, Instant> lastRead = convo.getLastReadAt() != null ? convo.getLastReadAt() : Map.of();

        Map<String, Instant> normalizedLastRead = lastRead.entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> normalizeParticipant(entry.getKey()),
                        Map.Entry::getValue,
                        (existing, replacement) -> existing));

        boolean changed = !normalizedParticipants.equals(convo.getParticipantMessengerIds())
                || !normalizedUnread.equals(convo.getUnreadByMessengerIds())
                || !normalizedLastRead.equals(convo.getLastReadAt());

        if (changed) {
            convo.setParticipantMessengerIds(normalizedParticipants);
            convo.setUnreadByMessengerIds(
                    normalizedUnread.stream()
                            .map(String::trim)
                            .filter(StringUtils::hasText)
                            .map(String::toLowerCase)
                            .distinct()
                            .collect(Collectors.toCollection(ArrayList::new)));
            convo.setLastReadAt(normalizedLastRead);
            conversationRepository.save(convo);
            migrateMessagesToMessengerIds(convo);
        }

        return convo;
    }

    private void migrateMessagesToMessengerIds(Conversation convo) {
        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(convo.getId());
        boolean changed = false;

        for (Message message : messages) {
            String sender = normalizeParticipant(message.getSenderMessengerId());
            String recipient = normalizeParticipant(message.getRecipientMessengerId());

            if (!sender.equals(message.getSenderMessengerId())) {
                message.setSenderMessengerId(sender);
                changed = true;
            }
            if (!recipient.equals(message.getRecipientMessengerId())) {
                message.setRecipientMessengerId(recipient);
                changed = true;
            }
        }

        if (changed) {
            messageRepository.saveAll(messages);
        }
    }

    private Conversation findOrCreateConversation(User userA, User userB) {
        String messengerA = ensureMessengerId(userA);
        String messengerB = ensureMessengerId(userB);
        List<String> key = participantKey(messengerA, messengerB);

        Optional<Conversation> existing = conversationRepository.findDirectConversation(key, key.size());
        if (existing.isEmpty()) {
            // Also search for legacy conversations that still store user IDs
            List<String> legacyKey = participantKey(userA.getId(), userB.getId());
            existing = conversationRepository.findDirectConversation(legacyKey, legacyKey.size());
        }

        if (existing.isPresent()) {
            return normalizeConversationParticipants(existing.get());
        }

        Conversation convo = Conversation.builder()
                .participantMessengerIds(key)
                .createdAt(Instant.now())
                .lastMessageAt(Instant.now())
                .lastMessagePreview("Say hello")
                .unreadByMessengerIds(new ArrayList<>())
                .build();

        return conversationRepository.save(convo);
    }

    public List<ConversationResponse> listConversations(String currentIdentifier) {
        User currentUser = loadUser(currentIdentifier);
        String currentMessengerId = ensureMessengerId(currentUser);

        List<Conversation> results = new ArrayList<>(
                conversationRepository.findByParticipantMessengerIdsContaining(currentMessengerId));
        if (!currentMessengerId.equals(currentUser.getId())) {
            results.addAll(conversationRepository.findByParticipantMessengerIdsContaining(currentUser.getId()));
        }

        Map<String, Conversation> unique = new LinkedHashMap<>();
        for (Conversation convo : results) {
            unique.put(convo.getId(), normalizeConversationParticipants(convo));
        }

        return unique.values().stream()
                .sorted(comparing(Conversation::getLastMessageAt).reversed())
                .map(convo -> toConversationResponse(convo, currentMessengerId))
                .toList();
    }

    public ConversationResponse openConversation(String currentIdentifier, String otherIdentifier) {
        User currentUser = loadUser(currentIdentifier);
        User otherUser = loadUser(otherIdentifier);
        Conversation convo = findOrCreateConversation(currentUser, otherUser);
        return toConversationResponse(convo, ensureMessengerId(currentUser));
    }

    public List<MessageResponse> getMessages(String currentIdentifier, String conversationId) {
        User currentUser = loadUser(currentIdentifier);
        String messengerId = ensureMessengerId(currentUser);

        Conversation convo = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        convo = normalizeConversationParticipants(convo);
        requireParticipant(convo, messengerId);

        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
        messages.forEach(this::normalizeMessageParticipants);
        return messages.stream()
                .map(this::toMessageResponse)
                .toList();
    }

    public MessageResponse sendMessage(String currentIdentifier, SendMessageRequest request) {
        if (!StringUtils.hasText(request.getBody())) {
            throw new IllegalArgumentException("Message body cannot be empty");
        }

        User senderUser = loadUser(currentIdentifier);
        String senderMessengerId = ensureMessengerId(senderUser);

        String recipientIdentifier = request.resolveRecipientMessengerId();
        User recipientUser = loadUser(recipientIdentifier);
        String recipientMessengerId = ensureMessengerId(recipientUser);

        Conversation convo = resolveConversation(senderUser, recipientUser, request.getConversationId());

        requireParticipant(convo, senderMessengerId);
        if (!convo.getParticipantMessengerIds().contains(recipientMessengerId)) {
            throw new IllegalArgumentException("Recipient is not part of this conversation");
        }

        Message message = Message.builder()
                .conversationId(convo.getId())
                .senderMessengerId(senderMessengerId)
                .recipientMessengerId(recipientMessengerId)
                .body(request.getBody().trim())
                .sentAt(Instant.now())
                .build();

        messageRepository.save(message);

        updateConversationMetadata(convo, message);
        conversationRepository.save(convo);

        return toMessageResponse(message);
    }

    public void markConversationRead(String currentIdentifier, String conversationId) {
        User currentUser = loadUser(currentIdentifier);
        String messengerId = ensureMessengerId(currentUser);

        Conversation convo = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        convo = normalizeConversationParticipants(convo);
        requireParticipant(convo, messengerId);

        List<Message> unread = messageRepository
                .findByConversationIdAndRecipientMessengerIdAndReadAtIsNull(conversationId, messengerId);

        Instant now = Instant.now();
        unread.forEach(msg -> msg.setReadAt(now));
        messageRepository.saveAll(unread);

        convo.getUnreadByMessengerIds().remove(messengerId);
        conversationRepository.save(convo);
    }

    private Conversation resolveConversation(User currentUser, User recipientUser, String conversationId) {
        if (StringUtils.hasText(conversationId)) {
            Conversation convo = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
            return normalizeConversationParticipants(convo);
        }
        return findOrCreateConversation(currentUser, recipientUser);
    }

    private void updateConversationMetadata(Conversation convo, Message latest) {
        convo.setLastMessageAt(latest.getSentAt());
        convo.setLastMessagePreview(truncate(latest.getBody(), 80));

        convo.getUnreadByMessengerIds().remove(latest.getSenderMessengerId());
        if (!convo.getUnreadByMessengerIds().contains(latest.getRecipientMessengerId())) {
            convo.getUnreadByMessengerIds().add(latest.getRecipientMessengerId());
        }
    }

    private ConversationResponse toConversationResponse(Conversation convo, String currentMessengerId) {
        String otherMessengerId = convo.getParticipantMessengerIds().stream()
                .filter(id -> !id.equals(currentMessengerId))
                .findFirst()
                .orElse(currentMessengerId);

        User other = findUser(otherMessengerId).orElse(null);

        return ConversationResponse.builder()
                .conversationId(convo.getId())
                .otherMessengerId(otherMessengerId)
                .otherUserId(other != null ? other.getId() : null)
                .otherUserName(displayName(other))
                .otherUserPhotoUrl(profilePhotoUrl(other))
                .lastMessagePreview(convo.getLastMessagePreview())
                .lastMessageAt(convo.getLastMessageAt())
                .hasUnread(convo.getUnreadByMessengerIds().contains(currentMessengerId))
                .build();
    }

    private MessageResponse toMessageResponse(Message message) {
        User sender = findUser(message.getSenderMessengerId()).orElse(null);

        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .senderMessengerId(message.getSenderMessengerId())
                .senderName(displayName(sender))
                .senderProfilePicUrl(profilePhotoUrl(sender))
                .recipientMessengerId(message.getRecipientMessengerId())
                .body(message.getBody())
                .sentAt(message.getSentAt())
                .readAt(message.getReadAt())
                .build();
    }

    private void normalizeMessageParticipants(Message message) {
        String sender = normalizeParticipant(message.getSenderMessengerId());
        String recipient = normalizeParticipant(message.getRecipientMessengerId());
        boolean changed = false;

        if (!sender.equals(message.getSenderMessengerId())) {
            message.setSenderMessengerId(sender);
            changed = true;
        }
        if (!recipient.equals(message.getRecipientMessengerId())) {
            message.setRecipientMessengerId(recipient);
            changed = true;
        }

        if (changed) {
            messageRepository.save(message);
        }
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
