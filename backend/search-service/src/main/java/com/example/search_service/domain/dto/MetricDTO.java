package com.example.search_service.domain.dto;

import com.example.search_service.domain.entity.Metric;
import lombok.Data;
import lombok.NoArgsConstructor;

import static com.example.search_service.helpter.SearchServiceHelper.cleanUnit;

@Data
@NoArgsConstructor
public class MetricDTO {
    private String id;
    private String name;
    private String category;
    private String unit;

    public MetricDTO(Metric metric) {
        this.id = metric.getId().toString();
        this.name = metric.getName();
        this.category = metric.getCategory();
        this.unit = cleanUnit(metric.getUnit());
    }
}