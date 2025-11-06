package com.plusone.PlusOneBackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConnectionRequestDto {
    
    private String id;
    private String fromUserId;
    private String toUserId;
    private String message;
    private String status;
    private String createdAt;
    private String updatedAt;
}
