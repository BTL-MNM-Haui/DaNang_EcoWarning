package com.example.search_service.service;

import com.example.search_service.domain.dto.MetricDTO;
import com.example.search_service.domain.dto.response.ObservationHistoryDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public interface MetricService {
    List<MetricDTO> getMetricByAssetId(Long assetId, String category);

    ObservationHistoryDTO getObservationHistory(Long assetId, Long metricId, LocalDate fromDate, LocalDate toDate);
}
