package com.plusone.PlusOneBackend.repository;

import com.plusone.PlusOneBackend.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    // Find user by email
    Optional<User> findByEmail(String email);

    // Check if email exists
    boolean existsByEmail(String email);

    List<User> findByProfileLocationCityIgnoreCaseAndIdNot(String city, String excludeUserId);

    @Query(value = "{ 'onboarding.completed': true, '_id': { $ne: ?0 } }")
    List<User> findCompletedOnboardingExcluding(String userId, Pageable pageable);
}
