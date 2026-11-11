package com.example.search_service.domain.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class ObservationSearchCriteria {

    private String q;

    private String assetId;

    private String metricId;

    private String assetType;

    private String district;

    private String metricCategory;

    private LocalDate fromDate;

    private LocalDate toDate;
}

