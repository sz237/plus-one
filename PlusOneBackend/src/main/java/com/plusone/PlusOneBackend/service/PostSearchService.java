package com.plusone.PlusOneBackend.service;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.PostRepository;
import com.plusone.PlusOneBackend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class PostSearchService {
    private static final int MAX_LIMIT = 100;

    private final PostRepository postRepository;
    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;

    public PostSearchService(PostRepository postRepository,
                             MongoTemplate mongoTemplate,
                             UserRepository userRepository) {
        this.postRepository = postRepository;
        this.mongoTemplate = mongoTemplate;
        this.userRepository = userRepository;
    }

    public List<Post> search(String category, String keyword, int limit) {
        if (category == null || category.trim().isEmpty()) {
            return List.of();
        }

        String normalizedCategory = category.trim();
        String trimmedKeyword = keyword == null ? "" : keyword.trim();
        int cappedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

        List<Post> posts;

        if (trimmedKeyword.isEmpty()) {
            Pageable page = PageRequest.of(0, cappedLimit);
            posts = postRepository.findByCategoryIgnoreCaseOrderByCreatedAtDesc(normalizedCategory, page);
        } else {
            String safe = Pattern.quote(trimmedKeyword);

            Criteria categoryCriteria = Criteria.where("category")
                    .regex("^" + Pattern.quote(normalizedCategory) + "$", "i");

            Criteria keywordCriteria = new Criteria().orOperator(
                    Criteria.where("title").regex(safe, "i"),
                    Criteria.where("description").regex(safe, "i"));

            Query query = new Query(new Criteria().andOperator(categoryCriteria, keywordCriteria))
                    .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                    .limit(cappedLimit);

            posts = mongoTemplate.find(query, Post.class);
        }

        attachAuthors(posts);
        return posts;
    }

    private void attachAuthors(List<Post> posts) {
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

        posts.forEach(post -> {
            User user = usersById.get(post.getUserId());
            if (user != null) {
                post.setAuthor(new Post.AuthorSummary(
                        user.getId(),
                        user.getFirstName(),
                        user.getLastName()
                ));
            } else {
                post.setAuthor(null);
            }
        });
    }
}
