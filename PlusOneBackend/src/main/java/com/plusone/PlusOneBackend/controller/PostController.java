package com.plusone.PlusOneBackend.controller;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.repository.PostRepository;
import com.plusone.PlusOneBackend.service.PostAuthorService;
import com.plusone.PlusOneBackend.service.PostSearchService;
import org.springframework.web.bind.annotation.*;
import com.plusone.PlusOneBackend.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

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
    boolean isEvent = p.getCategory() != null
        && p.getCategory().equalsIgnoreCase("Events");

    if (isEvent && p.getEventDate() != null) {
      ZonedDateTime start = p.getEventDate()
          .atTime(p.getEventTime() != null ? p.getEventTime() : LocalTime.of(23, 59, 59))
          .atZone(ZONE_CHICAGO);

      ZonedDateTime expires = p.getEventTime() != null
          ? start.plusHours(1) // expire at end of event window (1 hour default)
          : start; // if no time provided, treat as end-of-day

      p.setExpiresAt(Date.from(expires.toInstant()));
    } else {
      p.setExpiresAt(null);
    }

    if (!isEvent) {
      // Ensure non-event posts do not carry RSVP data.
      p.setRsvpUserIds(new ArrayList<>());
    } else {
      p.getRsvpUserIds(); // initialize for new events
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

  @PostMapping("/{postId}/rsvp")
  public ResponseEntity<?> rsvpEvent(
          @PathVariable String postId,
          @RequestParam String userId
  ) {
    try {
      Post updated = postService.rsvpToEvent(userId, postId);
      postAuthorService.attachAuthor(updated);
      return ResponseEntity.ok(updated);
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }
  }

  @DeleteMapping("/{postId}/rsvp")
  public ResponseEntity<?> cancelRsvp(
          @PathVariable String postId,
          @RequestParam String userId
  ) {
    try {
      Post updated = postService.cancelRsvp(userId, postId);
      postAuthorService.attachAuthor(updated);
      return ResponseEntity.ok(updated);
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/{postId}/rsvps")
  public ResponseEntity<?> listRsvps(
          @PathVariable String postId,
          @RequestParam String requestingUserId
  ) {
    try {
      List<Post.AuthorSummary> attendees = postService.getRsvps(postId, requestingUserId);
      return ResponseEntity.ok(attendees);
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }
  }
}
