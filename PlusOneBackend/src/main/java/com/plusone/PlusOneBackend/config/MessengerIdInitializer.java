package com.plusone.PlusOneBackend.config;

import com.plusone.PlusOneBackend.service.MessengerIdService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Ensures every existing user record has a messengerId so messenger-based
 * messaging works for legacy accounts as well.
 */
@Component
@RequiredArgsConstructor
public class MessengerIdInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MessengerIdInitializer.class);

    private final MessengerIdService messengerIdService;

    @Override
    public void run(String... args) {
        int updated = messengerIdService.backfillMissingMessengerIds();
        if (updated > 0) {
            log.info("Backfilled messenger IDs for {} existing users", updated);
        } else {
            log.info("All users already have messenger IDs");
        }
    }
}
