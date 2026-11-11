package com.example.search_service.repository;

import com.example.search_service.domain.entity.Metric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MetricRepository extends JpaRepository<Metric, Long> {

    @Query("SELECT m.name, m.unit FROM Metric m WHERE m.category = :category")
    List<Object[]> findNameAndUnitByCategory(@Param("category") String category);

    @Query("SELECT DISTINCT m FROM Observation o JOIN o.metric m " +
            "WHERE o.asset.id = :assetId " +
            "AND (:category IS NULL OR m.category = :category)")
    List<Metric> findMetricsByAssetIdAndOptionalCategory(
            @Param("assetId") Long assetId,
            @Param("category") String category
    );
}
