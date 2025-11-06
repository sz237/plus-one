package com.plusone.PlusOneBackend.controller;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.repository.PostRepository;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
public class PostController {

  private static final ZoneId ZONE_CHICAGO = ZoneId.of("America/Chicago");

  private final PostRepository repo;

  public PostController(PostRepository repo) {
    this.repo = repo;
  }

  @GetMapping
  public List<Post> list(@RequestParam String userId) {
    return repo.findByUserIdOrderByCreatedAtDesc(userId);
  }

  @PostMapping
  public Post create(@RequestBody Post p) {
    p.setId(null);
    if (p.getCreatedAt() == null) {
      p.setCreatedAt(Instant.now());
    }
    applyExpiry(p);
    return repo.save(p);
  }

  @PutMapping("/{id}")
  public Post update(@PathVariable String id, @RequestBody Post p) {
    p.setId(id);
    applyExpiry(p);
    return repo.save(p);
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable String id) {
    repo.deleteById(id);
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
}