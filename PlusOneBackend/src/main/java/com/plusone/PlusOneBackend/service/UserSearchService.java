package com.plusone.PlusOneBackend.service;

import com.plusone.PlusOneBackend.model.User;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class UserSearchService {
    private final MongoTemplate mongoTemplate;

    public UserSearchService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public List<User> searchByInterest(String query, int limit) {
        String safe = Pattern.quote(query.trim()); // escape regex special chars

        // Build query: look for users whose profile.interests array contains the search
        // term
        Query mongoQuery = new Query(
                Criteria.where("profile.interests").regex(safe, "i") // "i" = case-insensitive
        ).limit(Math.min(limit, 50));

        // Run query and return matching users
        return mongoTemplate.find(mongoQuery, User.class);
    }

}
