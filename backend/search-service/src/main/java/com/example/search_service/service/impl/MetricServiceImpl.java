package com.example.search_service.service.impl;

import com.example.search_service.constant.ErrorMessage;
import com.example.search_service.domain.dto.MetricDTO;
import com.example.search_service.domain.dto.ObservationSearchCriteria;
import com.example.search_service.domain.dto.response.ObservationHistoryDTO;
import com.example.search_service.domain.dto.response.TimeSeriesDataPoint;
import com.example.search_service.domain.entity.Asset;
import com.example.search_service.domain.entity.Metric;
import com.example.search_service.domain.entity.Observation;
import com.example.search_service.exception.VsException;
import com.example.search_service.repository.AssetSearchRepository;
import com.example.search_service.repository.MetricRepository;
import com.example.search_service.repository.ObservationSearchRepository;
import com.example.search_service.service.MetricService;
import com.example.search_service.util.ObservationSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MetricServiceImpl implements MetricService {

    private final MetricRepository metricRepository;
    private final ObservationSearchRepository observationSearchRepository;
    private final AssetSearchRepository assetSearchRepository;

    private final ObservationSpecification observationSpecification;

    @Override
    public List<MetricDTO> getMetricByAssetId(Long assetId, String category) {

        List<Metric> metrics = metricRepository.findMetricsByAssetIdAndOptionalCategory(
                assetId,
                category
        );

        return metrics.stream()
                .map(MetricDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public ObservationHistoryDTO getObservationHistory(
            Long assetId, Long metricId, LocalDate fromDate, LocalDate toDate
    ) {
        ObservationSearchCriteria criteria = new ObservationSearchCriteria();
        criteria.setAssetId(assetId.toString());
        criteria.setMetricId(metricId.toString());
        criteria.setFromDate(fromDate);
        criteria.setToDate(toDate);

        Specification<Observation> spec = observationSpecification.build(criteria);

        Sort sort = Sort.by(Sort.Direction.ASC, "recordTime");

        List<Observation> observations = observationSearchRepository.findAll(spec, sort);

        List<TimeSeriesDataPoint> timeSeries = observations.stream()
                .map(TimeSeriesDataPoint::new)
                .collect(Collectors.toList());

        Asset asset = assetSearchRepository.findById(assetId)
                .orElseThrow(() -> new VsException(ErrorMessage.ERR_ASSET_NOT_FOUND + assetId));
        Metric metric = metricRepository.findById(metricId)
                .orElseThrow(() -> new VsException(ErrorMessage.ERR_METRIC_NOT_FOUND + metricId));

        return new ObservationHistoryDTO(asset, metric, timeSeries);
    }
}
