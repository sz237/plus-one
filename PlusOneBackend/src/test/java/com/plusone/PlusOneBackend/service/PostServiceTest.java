package com.plusone.PlusOneBackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.model.User;
import com.plusone.PlusOneBackend.repository.PostRepository;
import com.plusone.PlusOneBackend.repository.UserRepository;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PostService postService;

    @Test
    void rsvp_sendsInviteToAttendeeAndOrganizer() {
        User attendee = User.builder().id("attendee").email("attendee@example.com").build();
        User organizer = User.builder().id("organizer").email("organizer@example.com").build();

        Post post = buildEventPost("post-1", organizer.getId());

        when(userRepository.findById("attendee")).thenReturn(Optional.of(attendee));
        when(postRepository.findById("post-1")).thenReturn(Optional.of(post));
        when(userRepository.findById("organizer")).thenReturn(Optional.of(organizer));
        when(postRepository.save(post)).thenReturn(post);

        postService.rsvpToEvent("attendee", "post-1");

        assertTrue(post.getRsvpUserIds().contains("attendee"));

        ArgumentCaptor<ZonedDateTime> startCaptor = ArgumentCaptor.forClass(ZonedDateTime.class);
        verify(emailService).sendEventInvite(eq(attendee), eq(organizer), eq(post), startCaptor.capture(), eq(Duration.ofHours(1)));
        verify(emailService).sendEventInvite(eq(organizer), eq(organizer), eq(post), any(ZonedDateTime.class), eq(Duration.ofHours(1)));

        assertEquals(ZoneId.of("America/Chicago"), startCaptor.getValue().getZone());
        verify(postRepository).save(post);
    }

    @Test
    void rsvp_byOrganizer_sendsSingleInvite() {
        User organizer = User.builder().id("organizer").email("organizer@example.com").build();
        Post post = buildEventPost("post-2", organizer.getId());

        when(userRepository.findById("organizer")).thenReturn(Optional.of(organizer));
        when(postRepository.findById("post-2")).thenReturn(Optional.of(post));
        when(userRepository.findById("organizer")).thenReturn(Optional.of(organizer));
        when(postRepository.save(post)).thenReturn(post);

        postService.rsvpToEvent("organizer", "post-2");

        verify(emailService, times(1)).sendEventInvite(eq(organizer), eq(organizer), eq(post), any(ZonedDateTime.class), eq(Duration.ofHours(1)));
        verifyNoMoreInteractions(emailService);
    }

    @Test
    void bookmarkingEventAddsRsvpAndInvites() {
        User user = User.builder().id("u1").email("user@example.com").bookmarkedPostIds(new ArrayList<>()).build();
        User organizer = User.builder().id("org").email("org@example.com").build();
        Post post = buildEventPost("post-3", organizer.getId());

        when(userRepository.findById("u1")).thenReturn(Optional.of(user), Optional.of(user)); // bookmark + rsvp lookup
        when(postRepository.findById("post-3")).thenReturn(Optional.of(post), Optional.of(post)); // bookmark + rsvp lookup
        when(userRepository.findById("org")).thenReturn(Optional.of(organizer));
        when(postRepository.save(post)).thenReturn(post);

        postService.bookmarkPost("u1", "post-3");

        assertTrue(user.getBookmarkedPostIds().contains("post-3"));
        assertTrue(post.getRsvpUserIds().contains("u1"));
        verify(emailService).sendEventInvite(eq(user), eq(organizer), eq(post), any(ZonedDateTime.class), eq(Duration.ofHours(1)));
        verify(emailService).sendEventInvite(eq(organizer), eq(organizer), eq(post), any(ZonedDateTime.class), eq(Duration.ofHours(1)));
    }

    @Test
    void unbookmarkEventCancelsRsvp() {
        User user = User.builder()
                .id("u1")
                .email("user@example.com")
                .bookmarkedPostIds(new ArrayList<>(List.of("post-4")))
                .build();
        User organizer = User.builder().id("org").email("org@example.com").build();
        Post post = buildEventPost("post-4", organizer.getId());
        post.getRsvpUserIds().add("u1");

        when(userRepository.findById("u1")).thenReturn(Optional.of(user), Optional.of(user)); // unbookmark + cancelRsvp
        when(postRepository.findById("post-4")).thenReturn(Optional.of(post), Optional.of(post)); // unbookmark + cancelRsvp
        when(postRepository.save(post)).thenReturn(post);

        postService.unbookmarkPost("u1", "post-4");

        assertTrue(user.getBookmarkedPostIds().isEmpty());
        assertTrue(post.getRsvpUserIds().isEmpty());
    }

    private Post buildEventPost(String id, String organizerId) {
        Post post = new Post();
        post.setId(id);
        post.setUserId(organizerId);
        post.setCategory("Events");
        post.setEventDate(LocalDate.of(2025, 1, 1));
        post.setEventTime(LocalTime.of(10, 0));
        post.setRsvpUserIds(new ArrayList<>());
        post.setTitle("Sample Event");
        post.setDescription("Description");
        return post;
    }
}
