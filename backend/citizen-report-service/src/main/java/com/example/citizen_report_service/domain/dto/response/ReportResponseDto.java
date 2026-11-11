package com.example.citizen_report_service.domain.dto.response;

import com.example.citizen_report_service.domain.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponseDto {
    private String reportType;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private OffsetDateTime eventStartTime;

    private OffsetDateTime eventEndTime;

    private OffsetDateTime createdAt;

    private String imageUrl;

    private String addressText;

    private String reportDescription;

    private ReportStatus status;

    private Object details;
}
