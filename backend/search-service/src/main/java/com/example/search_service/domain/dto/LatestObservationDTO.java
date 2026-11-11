package com.example.search_service.domain.dto;

import com.example.search_service.domain.entity.Observation;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LatestObservationDTO {

    private String metricId;
    private String metricName;
    private String category;
    private Double value;
    private String unit;
    private LocalDateTime recordTime;

    public LatestObservationDTO(Observation obs) {
        this.metricId = obs.getMetric().getId().toString();
        this.metricName = obs.getMetric().getName();
        this.category = obs.getMetric().getCategory();
        this.unit = obs.getMetric().getUnit();

        this.value = obs.getValue();
        this.recordTime = obs.getRecordTime();
    }
}