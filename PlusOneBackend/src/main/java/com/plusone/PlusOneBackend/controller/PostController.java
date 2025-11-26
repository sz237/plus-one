package com.plusone.PlusOneBackend.controller;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.repository.PostRepository;
import com.plusone.PlusOneBackend.service.PostAuthorService;
import com.plusone.PlusOneBackend.service.PostSearchService;
import org.springframework.web.bind.annotation.*;
import com.plusone.PlusOneBackend.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import java.time.*;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

  private static final ZoneId ZONE_CHICAGO = ZoneId.of("America/Chicago");

  private final PostRepository repo;
  private final PostSearchService postSearchService;
  private final PostAuthorService postAuthorService;

  @Autowired
  private PostService postService;

  public PostController(PostRepository repo,
                        PostSearchService postSearchService,
                        PostAuthorService postAuthorService) {
    this.repo = repo;
    this.postSearchService = postSearchService;
    this.postAuthorService = postAuthorService;
  }

  @GetMapping
  public List<Post> list(@RequestParam String userId) {
    List<Post> posts = repo.findByUserIdOrderByCreatedAtDesc(userId);
    postAuthorService.attachAuthors(posts);
    return posts;
  }

  @PostMapping
  public Post create(@RequestBody Post p) {
    p.setId(null);
    if (p.getCreatedAt() == null) {
      p.setCreatedAt(Instant.now());
    }
    applyExpiry(p);
    Post saved = repo.save(p);
    postAuthorService.attachAuthor(saved);
    return saved;
  }

  @PutMapping("/{id}")
  public Post update(@PathVariable String id, @RequestBody Post p) {
    p.setId(id);
    applyExpiry(p);
    Post saved = repo.save(p);
    postAuthorService.attachAuthor(saved);
    return saved;
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable String id) {
    repo.deleteById(id);
  }

  @GetMapping("/search")
  public List<Post> search(
          @RequestParam("category") String category,
          @RequestParam(value = "q", required = false) String query,
          @RequestParam(value = "limit", defaultValue = "24") int limit) {
    return postSearchService.search(category, query, limit);
  }

  private void applyExpiry(Post p) {
    if (p.getCategory() != null
        && p.getCategory().equalsIgnoreCase("Events")
        && p.getEventDate() != null) {

      ZonedDateTime endOfDay = p.getEventDate()
          .atTime(LocalTime.MAX)
          .atZone(ZONE_CHICAGO);
      p.setExpiresAt(Date.from(endOfDay.toInstant()));
    } else {
      p.setExpiresAt(null);
    }
  }

  @PostMapping("/{postId}/bookmark")
public ResponseEntity<Void> bookmarkPost(
        @PathVariable String postId,
        @RequestParam String userId
) {
    postService.bookmarkPost(userId, postId);
    return ResponseEntity.ok().build();
}

@DeleteMapping("/{postId}/bookmark")
public ResponseEntity<Void> unbookmarkPost(
        @PathVariable String postId,
        @RequestParam String userId
) {
    postService.unbookmarkPost(userId, postId);
    return ResponseEntity.noContent().build();
}

@GetMapping("/bookmarked")
public List<Post> getBookmarkedPosts(@RequestParam String userId) {
    return postService.getBookmarkedPosts(userId);
}
}
