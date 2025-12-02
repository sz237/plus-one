package com.plusone.PlusOneBackend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.PostRepository;
import com.plusone.PlusOneBackend.repository.UserRepository;

@Service
public class PostService {

    private static final String CATEGORY_EVENTS = "Events";

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Autowired
    public PostService(UserRepository userRepository,
                       PostRepository postRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
    }

    public void bookmarkPost(String userId, String postId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Optional: ensure post exists
        postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));

        List<String> bookmarks = user.getBookmarkedPostIds();
        if (bookmarks == null) {
            bookmarks = new ArrayList<>();
            user.setBookmarkedPostIds(bookmarks);
        }

        if (!bookmarks.contains(postId)) {
            bookmarks.add(postId);
        }

        userRepository.save(user);
    }

    public void unbookmarkPost(String userId, String postId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        List<String> bookmarks = user.getBookmarkedPostIds();
        if (bookmarks != null && bookmarks.remove(postId)) {
            userRepository.save(user);
        }
    }

    public List<Post> getBookmarkedPosts(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        List<String> ids = user.getBookmarkedPostIds();
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }

        return postRepository.findAllById(ids);
    }

    /**
     * Add the user to the RSVP list for an event post.
     */
    public Post rsvpToEvent(String userId, String postId) {
        User user = requireUser(userId);
        Post post = requireEventPost(postId);

        List<String> rsvps = post.getRsvpUserIds();
        if (!rsvps.contains(user.getId())) {
            rsvps.add(user.getId());
            post.setRsvpUserIds(rsvps);
            postRepository.save(post);
        }

        return post;
    }

    /**
     * Remove the user from the RSVP list for an event post.
     */
    public Post cancelRsvp(String userId, String postId) {
        requireUser(userId);
        Post post = requireEventPost(postId);

        List<String> rsvps = post.getRsvpUserIds();
        if (rsvps.remove(userId)) {
            postRepository.save(post);
        }

        return post;
    }

    /**
     * Return RSVP'd users for an event post (in RSVP order).
     */
    public List<Post.AuthorSummary> getRsvps(String postId, String requestingUserId) {
        Post post = requireEventPost(postId);
        if (requestingUserId != null && !requestingUserId.equals(post.getUserId())) {
            throw new RuntimeException("Only the author can view RSVPs for this event");
        }

        List<String> attendeeIds = post.getRsvpUserIds();
        if (attendeeIds.isEmpty()) {
            return List.of();
        }

        Map<String, User> usersById = userRepository.findAllById(attendeeIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        return attendeeIds.stream()
                .map(usersById::get)
                .filter(Objects::nonNull)
                .map(user -> new Post.AuthorSummary(user.getId(), user.getFirstName(), user.getLastName()))
                .collect(Collectors.toList());
    }

    private Post requireEventPost(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));

        if (!isEventsCategory(post)) {
            throw new RuntimeException("RSVPs are only supported for Events posts");
        }

        // Initialize RSVP list for older documents that might not have the field set yet.
        post.getRsvpUserIds();

        return post;
    }

    private boolean isEventsCategory(Post post) {
        return post.getCategory() != null && post.getCategory().equalsIgnoreCase(CATEGORY_EVENTS);
    }

    private User requireUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }
}
