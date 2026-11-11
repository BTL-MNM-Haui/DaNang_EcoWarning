package com.example.search_service.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Locale;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MetricYearlySummaryDTO {

    private String metricName;

    private Integer year;

    private String totalValue;

    private String unit;

    public MetricYearlySummaryDTO(String metricName, Integer year, Double totalValue, String unit) {
        this.metricName = metricName;
        this.year = year;
        this.unit = unit;

        if (totalValue != null) {
            this.totalValue = String.format(Locale.US, "%.2f", totalValue);
        } else {
            this.totalValue = null;
        }
    }
}