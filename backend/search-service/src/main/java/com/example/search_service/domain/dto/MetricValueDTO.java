package com.example.search_service.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Locale;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MetricValueDTO {

    private String metricName;
    private String value;
    private String unit;

    public MetricValueDTO(String metricName, Double value, String unit) {
        this.metricName = metricName;
        this.unit = unit;
        if (value != null) {
            this.value = String.format(Locale.US, "%.2f", value);
        } else {
            this.value = null;
        }
    }
}