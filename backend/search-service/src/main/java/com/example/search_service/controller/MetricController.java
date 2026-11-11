package com.example.search_service.controller;

import com.example.search_service.base.RestApiV1;
import com.example.search_service.base.VsResponseUtil;
import com.example.search_service.constant.UrlConstant;
import com.example.search_service.service.MetricService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

@RestApiV1
@RequiredArgsConstructor
public class MetricController {

    private final MetricService metricService;

    @Operation(
            summary = "Lấy các loại số liệu của asset",
            description = "Lấy các loại số liệu của asset (Ở đây đang dùng Hành Chính có ID: 1823)"
    )
    @GetMapping(UrlConstant.Metric.GET_METRIC_BY_ASSET_ID)
    public ResponseEntity<?> getMetricByAssetId(
            @PathVariable Long assetId,
            @RequestParam(required = false) String category
    ){
        return VsResponseUtil.success(metricService.getMetricByAssetId(assetId, category));
    }

    @Operation(
            summary = "Lấy các dữ liệu về thời tiết",
            description = "Lấy các dữ liệu về thời tiết"
    )
    @GetMapping(UrlConstant.Metric.GET_HISTORY_OF_METRIC)
    public ResponseEntity<?> getObservationHistory(
            @RequestParam Long assetId,
            @RequestParam Long metricId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return VsResponseUtil.success(metricService.getObservationHistory(assetId, metricId, fromDate, toDate));
    }
}
