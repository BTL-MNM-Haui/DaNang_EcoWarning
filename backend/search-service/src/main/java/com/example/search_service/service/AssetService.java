package com.example.search_service.service;

import com.example.search_service.domain.dto.response.AssetListDTO;
import com.example.search_service.domain.dto.response.AssetMapDTO;
import com.example.search_service.domain.dto.response.AssetProfileDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface AssetService {
    List<AssetMapDTO> getAssetsForMap(String assetType);

    List<AssetListDTO> getAssetsWithoutLocation(String assetType);

    AssetProfileDTO getAssetProfile(Long assetId);
}
