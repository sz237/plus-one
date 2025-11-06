package com.plusone.PlusOneBackend.dto;

import com.plusone.PlusOneBackend.model.Profile;
import lombok.Data;

/**
 * Request payload for updating a user's profile during onboarding.
 */
@Data
public class ProfileUpdateRequest {
    private Profile profile;
    private Integer step;
    private Boolean completed;
}

