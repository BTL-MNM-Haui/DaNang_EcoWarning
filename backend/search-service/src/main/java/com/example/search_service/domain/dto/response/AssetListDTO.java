package com.example.search_service.domain.dto.response;

import com.example.search_service.domain.entity.Asset;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;

import java.util.Map;

@Data
public class AssetListDTO {

    private String id;
    private String name;
    private String assetType;
    private String district;
    private String address;
    private Map<String, Object> attributes;

    public AssetListDTO(Asset asset, ObjectMapper objectMapper) {
        this.id = asset.getId().toString();
        this.name = asset.getName();
        this.assetType = asset.getAssetType();
        this.district = asset.getDistrict();
        this.address = asset.getAddress();

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
