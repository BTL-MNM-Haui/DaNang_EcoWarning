package com.example.search_service.controller;

import com.example.search_service.base.RestApiV1;
import com.example.search_service.base.VsResponseUtil;
import com.example.search_service.constant.UrlConstant;
import com.example.search_service.service.AssetService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@RestApiV1
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @Operation(
            summary = "Lấy các loại assets có tọa độ",
            description = "Lấy các loại assets có tọa độ"
    )
    @GetMapping(UrlConstant.Asset.GET_MAP)
    public ResponseEntity<?> getMapAssets(
            @RequestParam(required = false) String assetType
    ) {
        return VsResponseUtil.success(assetService.getAssetsForMap(assetType));
    }

    @Operation(
            summary = "Lấy các loại assets không có tọa độ",
            description = "Lấy các loại assets không có tọa độ"
    )
    @GetMapping(UrlConstant.Asset.GET_ASSET_LIST)
    public ResponseEntity<?> getAssetList(
            @RequestParam(required = false) String assetType
    ) {
        return VsResponseUtil.success(assetService.getAssetsWithoutLocation(assetType));
    }

    @Operation(
            summary = "Lấy thông tin chi tiết của asset",
            description = "Lấy thông tin chi tiết của asset"
    )
    @GetMapping(UrlConstant.Asset.GET_ASSET_PROFILE)
    public ResponseEntity<?> getAssetProfile(
            @PathVariable Long assetId
    ) {
        return VsResponseUtil.success(assetService.getAssetProfile(assetId));
    }
}
