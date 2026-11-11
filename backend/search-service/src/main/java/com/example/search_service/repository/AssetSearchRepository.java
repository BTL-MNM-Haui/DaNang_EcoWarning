package com.example.search_service.repository;

import com.example.search_service.domain.dto.response.AssetTypeCountDTO;
import com.example.search_service.domain.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetSearchRepository extends JpaRepository<Asset, Long>, JpaSpecificationExecutor<Asset> {
    @Query("SELECT new com.example.search_service.domain.dto.response.AssetTypeCountDTO(a.assetType, COUNT(a)) " +
            "FROM Asset a " +
            "GROUP BY a.assetType " +
            "ORDER BY COUNT(a) DESC")
    List<AssetTypeCountDTO> countAssetsByType();
}