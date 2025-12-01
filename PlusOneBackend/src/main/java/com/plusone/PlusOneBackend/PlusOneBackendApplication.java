package com.plusone.PlusOneBackend;

import java.util.Properties;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.annotation.Bean;                
import org.springframework.mail.javamail.JavaMailSender;        
import org.springframework.mail.javamail.JavaMailSenderImpl;

@SpringBootApplication
@EnableScheduling
public class PlusOneBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(PlusOneBackendApplication.class, args);
	}

	// Guarantee bean exists so our app can start and bind a port. If env vars are correct, 
	// emails will actually send; if they’re not, the app still boots and we can fix envs 
	// without blocking deploys.
	@Bean
	public JavaMailSender mailSender() {
    	String host = System.getenv("MAIL_HOST");
    	String port = System.getenv("MAIL_PORT");
    	String user = System.getenv("MAIL_USERNAME");
    	String pass = System.getenv("MAIL_PASSWORD");

    	org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(PlusOneBackendApplication.class);
    	
    	logger.info("[mail] Configuration check - MAIL_HOST={}, MAIL_PORT={}, USER_PRESENT={}, PASS_PRESENT={}", 
    			host != null ? host : "null", 
    			port != null ? port : "null",
    			user != null, 
    			pass != null);

    	JavaMailSenderImpl s = new JavaMailSenderImpl();
    	if (host != null && !host.isBlank()) {
	      s.setHost(host);
	      s.setPort((port == null || port.isBlank()) ? 587 : Integer.parseInt(port));
	      s.setUsername(user);
	      s.setPassword(pass);
	      Properties p = s.getJavaMailProperties();
	      p.put("mail.smtp.auth", "true");
	      p.put("mail.smtp.starttls.enable", "true");
	      logger.info("[mail] JavaMailSender successfully configured for host={}, port={}", host, s.getPort());
	    } else {
	      logger.warn("[mail] MAIL_HOST not set! Creating placeholder sender - EMAILS WILL NOT BE SENT. " +
	      		"Set MAIL_HOST, MAIL_PORT, MAIL_USERNAME, and MAIL_PASSWORD environment variables to enable email.");
	    }
    	return s;
  	}
}
