package com.example.search_service.domain.dto.response;

import com.example.search_service.domain.entity.Observation;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TimeSeriesDataPoint {
    private LocalDateTime timestamp;
    private String value;

    public TimeSeriesDataPoint(Observation obs) {
        this.timestamp = obs.getRecordTime();
        if (obs.getValue() != null) {
            this.value = String.format(java.util.Locale.US, "%.6f", obs.getValue());
        } else {
            this.value = null;
        }
    }
}
