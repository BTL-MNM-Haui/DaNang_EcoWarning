package com.example.search_service.domain.dto.response;

import com.example.search_service.domain.dto.LatestObservationDTO;
import com.example.search_service.domain.entity.Asset;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class AssetProfileDTO {

    private String id;
    private String name;
    private String assetType;
    private String district;
    private String ward;
    private String address;
    private Double latitude;
    private Double longitude;
    private Map<String, Object> attributes;

    private List<LatestObservationDTO> latestData;

    public AssetProfileDTO(Asset asset, List<LatestObservationDTO> latestData, ObjectMapper objectMapper) {
        this.id = asset.getId().toString();
        this.name = asset.getName();
        this.assetType = asset.getAssetType();
        this.district = asset.getDistrict();
        this.ward = asset.getWard();
        this.address = asset.getAddress();
        this.latitude = asset.getLatitude();
        this.longitude = asset.getLongitude();
        this.latestData = latestData;

        try {
            if (asset.getAttributes() != null && !asset.getAttributes().isEmpty()) {
                this.attributes = objectMapper.readValue(asset.getAttributes(), new TypeReference<>() {
                });
            }
        } catch (Exception e) {
            this.attributes = Map.of("error", "Failed to parse attributes");
        }
    }
}