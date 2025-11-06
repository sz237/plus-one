package com.plusone.PlusOneBackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Send notification when someone sends a connection request
     */
    public void sendConnectionRequestNotification(String recipientEmail, String recipientName, String requesterName, String message) {
        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(recipientEmail);
            email.setSubject("There's been an update in PlusOne");
            email.setText(
                "Hi " + recipientName + ",\n\n" +
                "You have received a new connection request from " + requesterName + " on PlusOne!\n\n" +
                "Message: " + message + "\n\n" +
                "Please log in to your PlusOne account to view and respond to this request.\n\n" +
                "Best regards,\n" +
                "The PlusOne Team"
            );
            
            mailSender.send(email);
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Failed to send email notification: " + e.getMessage());
        }
    }

    /**
     * Send notification when a connection request is accepted
     */
    public void sendConnectionAcceptedNotification(String recipientEmail, String recipientName, String accepterName) {
        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(recipientEmail);
            email.setSubject("There's been an update in PlusOne");
            email.setText(
                "Hi " + recipientName + ",\n\n" +
                "Great news! " + accepterName + " has accepted your connection request on PlusOne!\n\n" +
                "You are now connected and can start chatting and collaborating.\n\n" +
                "Please log in to your PlusOne account to start connecting.\n\n" +
                "Best regards,\n" +
                "The PlusOne Team"
            );
            
            mailSender.send(email);
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Failed to send email notification: " + e.getMessage());
        }
    }
}
