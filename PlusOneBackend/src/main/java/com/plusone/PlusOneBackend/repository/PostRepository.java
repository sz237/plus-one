package com.plusone.PlusOneBackend.repository;

import com.plusone.PlusOneBackend.model.Post;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PostRepository extends MongoRepository<Post, String> {
  List<Post> findByUserIdOrderByCreatedAtDesc(String userId);

  List<Post> findByCategoryIgnoreCaseOrderByCreatedAtDesc(String category, Pageable pageable);
}
