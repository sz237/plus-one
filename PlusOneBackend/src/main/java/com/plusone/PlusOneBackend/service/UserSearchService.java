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

    public List<User> searchByInterest(String query, int limit, String requestingUserId) {
        String safe = Pattern.quote(query.trim()); // escape regex special chars

        boolean roommateQuery = query.toLowerCase().contains("room");

        Criteria criteria = Criteria.where("profile.interests").regex(safe, "i");

        if (roommateQuery) {
            criteria = new Criteria().andOperator(criteria, Criteria.where("profile.lookingForRoommate").is(true));

            if (requestingUserId != null && !requestingUserId.isBlank()) {
                User requester = mongoTemplate.findById(requestingUserId, User.class);
                if (requester != null && requester.getProfile() != null && requester.getProfile().getLocation() != null) {
                    var loc = requester.getProfile().getLocation();
                    Criteria locationCriteria = new Criteria();
                    // Build AND conditions for available location parts
                    if (loc.getCity() != null && !loc.getCity().isBlank()) {
                        locationCriteria = locationCriteria.and("profile.location.city")
                                .regex("^" + Pattern.quote(loc.getCity()) + "$", "i");
                    }
                    if (loc.getState() != null && !loc.getState().isBlank()) {
                        locationCriteria = locationCriteria.and("profile.location.state")
                                .regex("^" + Pattern.quote(loc.getState()) + "$", "i");
                    }
                    if (loc.getCountry() != null && !loc.getCountry().isBlank()) {
                        locationCriteria = locationCriteria.and("profile.location.country")
                                .regex("^" + Pattern.quote(loc.getCountry()) + "$", "i");
                    }
                    criteria = new Criteria().andOperator(criteria, locationCriteria);
                }
            }
        }

        Query mongoQuery = new Query(criteria)
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

}
