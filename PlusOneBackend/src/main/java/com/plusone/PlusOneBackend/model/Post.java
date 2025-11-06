package com.plusone.PlusOneBackend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;

@Document("posts")
public class Post {
  @Id
  private String id;

  private String userId;
  private String category;   // Events | Job opportunities | Internships | Housing
  private String title;
  private String description;
  private String imageUrl;   // optional; store a URL or filename

  private Instant createdAt = Instant.now();

  private LocalDate eventDate;

  private Date expiresAt;

  // getters/setters/constructors
  public Post() {}

  // getters/setters
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }

  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public String getImageUrl() { return imageUrl; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

  public LocalDate getEventDate() { return eventDate; }
  public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }

  public Date getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Date expiresAt) { this.expiresAt = expiresAt; }
}