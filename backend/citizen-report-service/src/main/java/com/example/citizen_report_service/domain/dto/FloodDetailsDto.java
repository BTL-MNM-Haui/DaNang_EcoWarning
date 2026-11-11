package com.example.citizen_report_service.domain.dto;

import lombok.Data;

@Data
public class FloodDetailsDto {
    private Double estimatedDepthCm;
    private String floodType;
    private Boolean isFrequency = false;
}
