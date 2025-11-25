package com.plusone.PlusOneBackend.service;

import com.plusone.PlusOneBackend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.List;
import java.util.HexFormat;

@Service
public class MessengerIdService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserRepository userRepository;

    public MessengerIdService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String generateMessengerId(String firstName, String lastName) {
        String base = (firstName == null ? "" : firstName) + (lastName == null ? "" : lastName);
        base = Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase();

        if (base.isBlank()) {
            base = "user";
        }
        base = base.length() > 20 ? base.substring(0, 20) : base;

        for (int attempt = 0; attempt < 12; attempt++) {
            String candidate = base + "-" + randomSuffix();
            if (!userRepository.existsByMessengerId(candidate)) {
                return candidate;
            }
        }

        throw new IllegalStateException("Unable to generate unique messenger ID");
    }

    private String randomSuffix() {
        byte[] randomBytes = new byte[2];
        RANDOM.nextBytes(randomBytes);
        return HexFormat.of().formatHex(randomBytes);
    }

    /**
     * Ensure the provided user has a messengerId. If missing, generate one,
     * persist it, and return the value.
     */
    public String ensureMessengerId(com.plusone.PlusOneBackend.model.User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        if (user.getMessengerId() != null && !user.getMessengerId().isBlank()) {
            return user.getMessengerId();
        }
        String generated = generateMessengerId(user.getFirstName(), user.getLastName());
        user.setMessengerId(generated);
        userRepository.save(user);
        return generated;
    }

    /**
     * Backfill messenger IDs for any existing users missing one.
     *
     * @return the number of users updated
     */
    public int backfillMissingMessengerIds() {
        List<com.plusone.PlusOneBackend.model.User> users = userRepository.findAll();
        int count = 0;
        for (com.plusone.PlusOneBackend.model.User user : users) {
            if (user.getMessengerId() == null || user.getMessengerId().isBlank()) {
                ensureMessengerId(user);
                count++;
            }
        }
        return count;
    }
}
