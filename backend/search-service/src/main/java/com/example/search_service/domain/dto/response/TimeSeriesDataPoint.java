package com.example.search_service.domain.dto.response;

import com.example.search_service.domain.entity.Observation;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TimeSeriesDataPoint {
    private Long id;
    private LocalDateTime timestamp;
    private String value;
    private String quality = "VALID";
    TimeSeriesDataPoint(LocalDateTime timestamp, String quality) {
        this.timestamp = timestamp;
        this.quality = quality;
    }
    public TimeSeriesDataPoint(Observation obs) {
        this.id = obs.getId();
        this.timestamp = obs.getRecordTime();
        this.value = obs.getValue() != null && Double.isFinite(obs.getValue())
                ? BigDecimal.valueOf(obs.getValue()).stripTrailingZeros().toPlainString() : null;
        if (this.value == null) this.quality = "MISSING";
    }
}
