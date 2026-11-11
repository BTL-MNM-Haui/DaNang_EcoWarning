package com.example.search_service.controller;

import com.example.search_service.base.RestApiV1;
import com.example.search_service.base.VsResponseUtil;
import com.example.search_service.constant.UrlConstant;
import com.example.search_service.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestApiV1
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @Operation(
            summary = "Đếm số asset",
            description = "Đếm số asset hiện có"
    )
    @GetMapping(UrlConstant.Static.COUNT_TYPE)
    public ResponseEntity<?> getAssetCountsByType() {
        return VsResponseUtil.success(statisticsService.getAssetCountsByType());
    }

    @Operation(
            summary = "Lấy thông tin về thiệt hại do thiên tai qua từng năm",
            description = "Lấy thông tin về thiệt hại do thiên tai qua từng năm (Tỷ đồng)"
    )
    @GetMapping(UrlConstant.Static.DISASTER_DAMAGE_BY_YEAR)
    public ResponseEntity<?> getDisasterDamageSummary() {
        return VsResponseUtil.success(statisticsService.getDisasterDamageSummaryByYear());
    }

    @Operation(
            summary = "Lấy thông tin về thiệt hại do thiên tai trong một năm",
            description = "Lấy thông tin về thiệt hại do thiên tai trong một năm"
    )
    @GetMapping(UrlConstant.Static.DISASTER_DAMAGE_DETAIL)
    public ResponseEntity<?> getDisasterDamageDetails(
            @RequestParam Integer year
    ) {
        return VsResponseUtil.success(statisticsService.getDisasterDamageDetailsByYear(year));
    }

    @Operation(
            summary = "Lấy thông tin về nông nghiệp dựa theo tiêu chí tìm kiếm",
            description = "Lấy thông tin về nông nghiệp dựa theo tiêu chí tìm kiếm"
    )
    @GetMapping(UrlConstant.Static.AGRICULTURE_SEARCH)
    public ResponseEntity<?> searchAgriculture(
            @RequestParam(required = false) String unit,
            @RequestParam(required = false) String crop,
            @RequestParam(required = false) String aspect
    ) {
        return VsResponseUtil.success(statisticsService.searchAgricultureSummary(unit, crop, aspect));
    }


    @Operation(
            summary = "Lấy thông tin về các tiêu chí tìm kiếm về nông nghiệp",
            description = "Lấy thông tin về các tiêu chí tìm kiếm về nông nghiệp"
    )
    @GetMapping(UrlConstant.Static.AGRICULTURE_FILTER)
    public ResponseEntity<?> getAgricultureFilters() {
        return VsResponseUtil.success(statisticsService.getAgricultureFilterOptions());
    }
}
