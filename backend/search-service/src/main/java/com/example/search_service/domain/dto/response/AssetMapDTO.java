package com.example.search_service.domain.dto.response;

import com.example.search_service.domain.entity.Asset;
import lombok.Data;

@Data
public class AssetMapDTO {

    private String id;
    private String name;
    private String assetType;
    private String latitude;
    private String longitude;

    public AssetMapDTO(Asset asset) {
        this.id = asset.getId().toString();
        this.name = asset.getName();
        this.assetType = asset.getAssetType();
        if (asset.getLatitude() != null) {
            this.latitude = String.format(java.util.Locale.US, "%.6f", asset.getLatitude());
        } else {
            this.latitude = null;
        }

        if (asset.getLongitude() != null) {
            this.longitude = String.format(java.util.Locale.US, "%.6f", asset.getLongitude());
        } else {
            this.longitude = null;
        }
    }
}