package com.plusone.PlusOneBackend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

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
}
