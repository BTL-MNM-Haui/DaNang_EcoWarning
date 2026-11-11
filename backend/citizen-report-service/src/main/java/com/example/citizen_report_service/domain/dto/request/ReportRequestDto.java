package com.example.citizen_report_service.domain.dto.request;

import com.example.citizen_report_service.constant.LogMessage;
import com.example.citizen_report_service.domain.validator.SafeText;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportRequestDto {

    @NotBlank(message = LogMessage.REPORT_TYPE_EMPTY)
    private String reportType;

    private BigDecimal latitude;

    private BigDecimal longitude;

    @PastOrPresent(message = LogMessage.REPORT_TIME_NOT_VALID)
    private OffsetDateTime eventStartTime;

    @PastOrPresent(message = LogMessage.REPORT_TIME_NOT_VALID)
    private OffsetDateTime eventEndTime;

    private String addressText;

    @Size(max = 500, message = LogMessage.REPORT_DESCRIPTION_TOO_LONG)
    @SafeText(message = LogMessage.REPORT_DESCRIPTION_NOT_SAFE)
    private String reportDescription;

    private Object details;
}
