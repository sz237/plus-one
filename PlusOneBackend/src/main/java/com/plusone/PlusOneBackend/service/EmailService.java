package com.plusone.PlusOneBackend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.plusone.PlusOneBackend.model.Post;
import com.plusone.PlusOneBackend.model.User;

import jakarta.mail.internet.MimeMessage;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter HUMAN_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm z");

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:chooseluke@gmail.com}")
    private String defaultFrom;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        logger.info("EmailService initialized. Mail sender configured: {}", 
                mailSender != null ? "yes" : "no");
    }

    /**
     * Send notification when someone sends a connection request
     */
    public void sendConnectionRequestNotification(String recipientEmail, String recipientName, String requesterName,
            String message) {
        try {
            logger.info("Attempting to send connection request notification to: {}", recipientEmail);
            SimpleMailMessage email = new SimpleMailMessage();
            email.setFrom(defaultFrom);
            email.setTo(recipientEmail);
            email.setSubject("There's been an update in PlusOne");
            email.setText(
                    "Hi " + recipientName + ",\n\n" +
                            "You have received a new connection request from " + requesterName + " on PlusOne!\n\n" +
                            "Message: " + message + "\n\n" +
                            "Please log in to your PlusOne account to view and respond to this request.\n\n" +
                            "Best regards,\n" +
                            "The PlusOne Team");

            mailSender.send(email);
            logger.info("Successfully sent connection request notification to: {}", recipientEmail);
        } catch (Exception e) {
            // Log error but don't fail the request
            logger.error("Failed to send connection request notification to: {}. Error: {}", 
                    recipientEmail, e.getMessage(), e);
        }
    }

    /**
     * Send notification when a connection request is accepted
     */
    public void sendConnectionAcceptedNotification(String recipientEmail, String recipientName, String accepterName) {
        try {
            logger.info("Attempting to send connection accepted notification to: {}", recipientEmail);
            SimpleMailMessage email = new SimpleMailMessage();
            email.setFrom(defaultFrom);
            email.setTo(recipientEmail);
            email.setSubject("There's been an update in PlusOne");
            email.setText(
                    "Hi " + recipientName + ",\n\n" +
                            "Great news! " + accepterName + " has accepted your connection request on PlusOne!\n\n" +
                            "You are now connected and can start chatting and collaborating.\n\n" +
                            "Please log in to your PlusOne account to start connecting.\n\n" +
                            "Best regards,\n" +
                            "The PlusOne Team");

            mailSender.send(email);
            logger.info("Successfully sent connection accepted notification to: {}", recipientEmail);
        } catch (Exception e) {
            // Log error but don't fail the request
            logger.error("Failed to send connection accepted notification to: {}. Error: {}", 
                    recipientEmail, e.getMessage(), e);
        }
    }

    /**
     * Send an event invite (ICS) to an attendee for a given event.
     */
    public void sendEventInvite(User attendee, User organizer, Post post, ZonedDateTime start, Duration duration) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            String subject = "You're invited: " + post.getTitle();
            helper.setFrom(defaultFrom);
            helper.setTo(attendee.getEmail());
            helper.setSubject(subject);
            helper.setText(buildPlainBody(attendee, organizer, post, start, duration), false);

            String icsContent = buildIcs(attendee, organizer, post, start, duration);
            helper.addAttachment("event.ics",
                    new ByteArrayResource(icsContent.getBytes(StandardCharsets.UTF_8)),
                    "text/calendar; method=REQUEST; charset=UTF-8");

            mailSender.send(message);
            logger.info("Sent event invite email with ICS to {}", attendee.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send event invite email to {}: {}", attendee != null ? attendee.getEmail() : "unknown", e.getMessage(), e);
        }
    }

    private String buildPlainBody(User attendee, User organizer, Post post, ZonedDateTime start, Duration duration) {
        String organizerName = (organizer != null)
                ? (organizer.getFirstName() + " " + organizer.getLastName()).trim()
                : "Event organizer";
        return "Hi " + attendee.getFirstName() + ",\n\n"
                + "You RSVP'd to \"" + post.getTitle() + "\".\n"
                + "When: " + start.truncatedTo(ChronoUnit.MINUTES).format(HUMAN_TIME) + " (" + duration.toHours() + " hour)\n\n"
                + "Details: " + post.getDescription() + "\n\n"
                + "Organizer: " + organizerName + "\n\n"
                + "An iCalendar invite is attached so you can add this to your calendar.\n\n"
                + "The PlusOne Team";
    }

    private String buildIcs(User attendee, User organizer, Post post, ZonedDateTime start, Duration duration) {
        ZonedDateTime end = start.plus(duration);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
        String uid = UUID.randomUUID().toString() + "@plusone";

        String organizerEmail = organizer != null ? organizer.getEmail() : defaultFrom;
        String attendeeEmail = attendee != null ? attendee.getEmail() : "";
        String attendeeName = attendee != null
                ? (attendee.getFirstName() + " " + attendee.getLastName()).trim()
                : "Guest";
        String organizerName = organizer != null
                ? (organizer.getFirstName() + " " + organizer.getLastName()).trim()
                : "Organizer";

        return "BEGIN:VCALENDAR\r\n"
                + "PRODID:-//PlusOne//EN\r\n"
                + "VERSION:2.0\r\n"
                + "METHOD:REQUEST\r\n"
                + "BEGIN:VEVENT\r\n"
                + "UID:" + uid + "\r\n"
                + "DTSTAMP:" + ZonedDateTime.now(ZoneOffset.UTC).format(fmt) + "\r\n"
                + "DTSTART:" + start.withZoneSameInstant(ZoneOffset.UTC).format(fmt) + "\r\n"
                + "DTEND:" + end.withZoneSameInstant(ZoneOffset.UTC).format(fmt) + "\r\n"
                + "SUMMARY:" + escape(post.getTitle()) + "\r\n"
                + "DESCRIPTION:" + escape(post.getDescription()) + "\r\n"
                + "ORGANIZER;CN=" + escape(organizerName) + ":MAILTO:" + organizerEmail + "\r\n"
                + "ATTENDEE;CN=" + escape(attendeeName) + ";ROLE=REQ-PARTICIPANT:MAILTO:" + attendeeEmail + "\r\n"
                + "END:VEVENT\r\n"
                + "END:VCALENDAR\r\n";
    }

    private String escape(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\n", "\\n");
    }
}
