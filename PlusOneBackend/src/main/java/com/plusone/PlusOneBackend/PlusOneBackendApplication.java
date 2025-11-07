package com.plusone.PlusOneBackend;

import java.util.Properties;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;                
import org.springframework.mail.javamail.JavaMailSender;        
import org.springframework.mail.javamail.JavaMailSenderImpl;

@SpringBootApplication
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

    	System.out.println("[mail] MAIL_HOST=" + host + " MAIL_PORT=" + port +
                       " USER_PRESENT=" + (user != null) + " PASS_PRESENT=" + (pass != null));

    	JavaMailSenderImpl s = new JavaMailSenderImpl();
    	if (host != null && !host.isBlank()) {
	      s.setHost(host);
	      s.setPort((port == null || port.isBlank()) ? 587 : Integer.parseInt(port));
	      s.setUsername(user);
	      s.setPassword(pass);
	      Properties p = s.getJavaMailProperties();
	      p.put("mail.smtp.auth", "true");
	      p.put("mail.smtp.starttls.enable", "true");
	      System.out.println("[mail] JavaMailSender configured for host=" + host);
	    } else {
	      System.out.println("[mail] MAIL_HOST not set; creating placeholder sender (app will still start)");
	    }
    	return s;
  	}
}
