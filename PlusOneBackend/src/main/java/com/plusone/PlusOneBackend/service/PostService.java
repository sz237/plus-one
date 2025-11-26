package com.plusone.PlusOneBackend.service;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.PostRepository;
import com.plusone.PlusOneBackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PostService {

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
}