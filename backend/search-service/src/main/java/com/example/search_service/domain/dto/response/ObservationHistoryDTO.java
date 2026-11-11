package com.example.search_service.domain.dto.response;

import com.example.search_service.domain.entity.Asset;
import com.example.search_service.domain.entity.Metric;
import lombok.Data;

import java.util.List;

import static com.example.search_service.helpter.SearchServiceHelper.cleanUnit;

@Data
public class ObservationHistoryDTO {

    private String assetName;
    private String metricName;
    private String unit;

    private List<TimeSeriesDataPoint> timeSeries;

    public ObservationHistoryDTO(Asset asset, Metric metric, List<TimeSeriesDataPoint> timeSeries) {
        this.assetName = asset.getName();
        this.metricName = metric.getName();
        this.unit = cleanUnit(metric.getUnit());
        this.timeSeries = timeSeries;
    }
}
