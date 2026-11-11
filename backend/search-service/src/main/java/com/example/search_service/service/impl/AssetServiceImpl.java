package com.example.search_service.service.impl;

import com.example.search_service.constant.ErrorMessage;
import com.example.search_service.domain.dto.LatestObservationDTO;
import com.example.search_service.domain.dto.response.AssetListDTO;
import com.example.search_service.domain.dto.response.AssetMapDTO;
import com.example.search_service.domain.dto.response.AssetProfileDTO;
import com.example.search_service.domain.entity.Asset;
import com.example.search_service.domain.entity.Observation;
import com.example.search_service.exception.VsException;
import com.example.search_service.repository.AssetSearchRepository;
import com.example.search_service.repository.ObservationSearchRepository;
import com.example.search_service.service.AssetService;
import com.example.search_service.util.AssetSpecification;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssetServiceImpl implements AssetService {

    private final AssetSearchRepository assetRepository;
    private final ObservationSearchRepository observationRepository;
    private final AssetSpecification assetSpecification;

    private final ObjectMapper objectMapper;

    @Override
    public List<AssetMapDTO> getAssetsForMap(String assetType) {
        Specification<Asset> spec = assetSpecification.getMapAssets(assetType);

        List<Asset> assets = assetRepository.findAll(spec);

        return assets.stream()
                .map(AssetMapDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public List<AssetListDTO> getAssetsWithoutLocation(String assetType) {

        Specification<Asset> spec = assetSpecification.getNonGeoAssets(assetType);
        List<Asset> assets = assetRepository.findAll(spec);

        return assets.stream()
                .map(asset -> new AssetListDTO(asset, objectMapper))
                .collect(Collectors.toList());
    }

    @Override
    public AssetProfileDTO getAssetProfile(Long assetId) {

        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new VsException(ErrorMessage.ERR_ASSET_NOT_FOUND + assetId));

        List<Observation> latestObs = observationRepository.findLatestObservationsForAsset(assetId);

        List<LatestObservationDTO> latestDataDTOs = latestObs.stream()
                .map(LatestObservationDTO::new)
                .collect(Collectors.toList());

        return new AssetProfileDTO(asset, latestDataDTOs, objectMapper);
    }
}