package com.plusone.PlusOneBackend.dto;

import com.plusone.PlusOneBackend.model.Profile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    
    private String userId;
    private String firstName;
    private String lastName;
    private String email;
    private Profile profile;
    private String createdAt;
}
