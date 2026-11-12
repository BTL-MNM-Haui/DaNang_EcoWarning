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
    private String unitRaw;
    private Long assetId;
    private Long metricId;
    private String category;
    private ObservationQuality quality;
    private String source = "Dữ liệu lịch sử nhập từ CSV";

    private List<TimeSeriesDataPoint> timeSeries;

    public ObservationHistoryDTO(Asset asset, Metric metric, List<TimeSeriesDataPoint> timeSeries) {
        this.assetName = asset.getName();
        this.metricName = metric.getName();
        this.assetId = asset.getId();
        this.metricId = metric.getId();
        this.category = metric.getCategory();
        this.unitRaw = metric.getUnit();
        this.unit = cleanUnit(metric.getUnit());
        this.quality = new ObservationQuality(timeSeries);
        this.timeSeries = timeSeries;
    }
}
