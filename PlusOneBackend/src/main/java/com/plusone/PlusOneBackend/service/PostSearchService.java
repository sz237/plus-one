package com.plusone.PlusOneBackend.service;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.repository.PostRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class PostSearchService {
    private static final int MAX_LIMIT = 100;

    private final PostRepository postRepository;
    private final MongoTemplate mongoTemplate;

    public PostSearchService(PostRepository postRepository, MongoTemplate mongoTemplate) {
        this.postRepository = postRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public List<Post> search(String category, String keyword, int limit) {
        if (category == null || category.trim().isEmpty()) {
            return List.of();
        }

        String normalizedCategory = category.trim();
        String trimmedKeyword = keyword == null ? "" : keyword.trim();
        int cappedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

        if (trimmedKeyword.isEmpty()) {
            Pageable page = PageRequest.of(0, cappedLimit);
            return postRepository.findByCategoryIgnoreCaseOrderByCreatedAtDesc(normalizedCategory, page);
        }

        String safe = Pattern.quote(trimmedKeyword);

        Criteria categoryCriteria = Criteria.where("category")
                .regex("^" + Pattern.quote(normalizedCategory) + "$", "i");

        Criteria keywordCriteria = new Criteria().orOperator(
                Criteria.where("title").regex(safe, "i"),
                Criteria.where("description").regex(safe, "i"));

        Query query = new Query(new Criteria().andOperator(categoryCriteria, keywordCriteria))
                .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .limit(cappedLimit);

        return mongoTemplate.find(query, Post.class);
    }
}
