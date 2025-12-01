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

        Query mongoQuery = new Query(
                Criteria.where("profile.interests").regex(safe, "i")
        )
                .limit(Math.min(Math.max(limit, 1), 50));

        return mongoTemplate.find(mongoQuery, User.class);
    }

    public List<User> searchByName(String query, int limit) {
        String safe = Pattern.quote(query.trim());

        Criteria criteria = new Criteria().orOperator(
                Criteria.where("firstName").regex(safe, "i"),
                Criteria.where("lastName").regex(safe, "i")
        );

        Query mongoQuery = new Query(criteria)
                .limit(Math.min(Math.max(limit, 1), 50));

        return mongoTemplate.find(mongoQuery, User.class);
    }

    public List<User> searchRoommatesByLocation(String query, int limit) {
        String safe = Pattern.quote(query.trim());

        Criteria locationMatches = new Criteria().orOperator(
                Criteria.where("profile.location.city").regex(safe, "i"),
                Criteria.where("profile.location.state").regex(safe, "i"),
                Criteria.where("profile.location.country").regex(safe, "i")
        );

        Criteria criteria = new Criteria().andOperator(
                Criteria.where("profile.lookingForRoommate").is(true),
                locationMatches
        );

        Query mongoQuery = new Query(criteria)
                .limit(Math.min(Math.max(limit, 1), 50));

        return mongoTemplate.find(mongoQuery, User.class);
    }

}
