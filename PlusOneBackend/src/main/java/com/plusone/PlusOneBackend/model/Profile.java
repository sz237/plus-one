package com.plusone.PlusOneBackend.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Profile information captured during the multi-step onboarding flow.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    // ---- Step 1: demographics ----

    public enum Gender {
        MALE,
        FEMALE,
        NON_BINARY,
        OTHER,
        PREFER_NOT_TO_SAY
    }

    private Gender gender;      // nullable until set

    private Integer age;        // validated (13..120) at service/controller layer

    @Builder.Default
    private Location location = new Location();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Location {
        private String city;               // e.g., "Nashville"
        private String state;              // e.g., "TN"
        private String country;            // e.g., "US"
        private Double latitude;           // optional
        private Double longitude;          // optional
    }

    // ---- Step 2: job ----

    @Builder.Default
    private Job job = new Job();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Job {
        private String title;              // e.g., "Software Engineer"
        private String companiesName;      // e.g., "Microsoft"
        private String companyId;          // optional persistent identifier
    }

    // ---- Step 3: interests ----

    @Builder.Default
    private List<String> interests = List.of();

    // ---- Step 4: photo ----

    @Builder.Default
    private Photo profilePhoto = new Photo();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Photo {
        private String storage;                  // "gridfs" | "s3" | "gcs"
        private String key;                      // storage-specific identifier
        private String url;                      // CDN/public URL if applicable
    }

    @Builder.Default
    private int numConnections = 0;

    @Builder.Default
    private int numRequests = 0;
}

