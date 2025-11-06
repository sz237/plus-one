package com.plusone.PlusOneBackend.repository;

import com.plusone.PlusOneBackend.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
  List<Post> findByUserIdOrderByCreatedAtDesc(String userId);
}