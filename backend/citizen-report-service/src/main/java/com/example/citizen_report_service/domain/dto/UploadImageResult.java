package com.example.citizen_report_service.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UploadImageResult {
    private String publicId;
    private String secureUrl;
}
