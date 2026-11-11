package com.example.citizen_report_service.domain.dto;

import lombok.Data;

@Data
public class SevereTrafficJamDetailsDto {
    private String cause;
    private Double estimatedLengthKm;
}
