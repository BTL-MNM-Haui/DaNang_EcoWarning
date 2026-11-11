package com.example.collector_data_service.repository;

import com.example.collector_data_service.domain.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
    boolean existsByName(String name);

    @Query("SELECT a.name FROM Asset a")
    Set<String> findAllNamesInDb();

    Optional<Asset> findByName(String name);
}
