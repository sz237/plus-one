package com.plusone.PlusOneBackend.service;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PostAuthorService {
    private final UserRepository userRepository;

    public PostAuthorService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void attachAuthors(List<Post> posts) {
        if (posts == null || posts.isEmpty()) {
            return;
        }

        Set<String> userIds = posts.stream()
                .map(Post::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (userIds.isEmpty()) {
            return;
        }

        Map<String, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        posts.forEach(post -> setAuthor(post, usersById.get(post.getUserId())));
    }

    public void attachAuthor(Post post) {
        if (post == null || post.getUserId() == null) {
            return;
        }
        userRepository.findById(post.getUserId())
                .ifPresent(user -> setAuthor(post, user));
    }

    private void setAuthor(Post post, User user) {
        if (post == null) {
            return;
        }
        if (user == null) {
            post.setAuthor(null);
            return;
        }
        post.setAuthor(new Post.AuthorSummary(
                user.getId(),
                user.getFirstName(),
                user.getLastName()
        ));
    }
}
