package com.example.search_service.service;

import com.example.search_service.domain.dto.AgricultureFilterOptionsDTO;
import com.example.search_service.domain.dto.MetricValueDTO;
import com.example.search_service.domain.dto.response.AssetTypeCountDTO;
import com.example.search_service.domain.dto.response.MetricYearlySummaryDTO;
import com.example.search_service.domain.dto.response.YearlySummaryDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface StatisticsService {
    List<AssetTypeCountDTO> getAssetCountsByType();

    List<YearlySummaryDTO> getDisasterDamageSummaryByYear();

    List<MetricValueDTO> getDisasterDamageDetailsByYear(Integer year);

    List<MetricYearlySummaryDTO> searchAgricultureSummary(String unit, String crop, String aspect);

    AgricultureFilterOptionsDTO getAgricultureFilterOptions();
}
