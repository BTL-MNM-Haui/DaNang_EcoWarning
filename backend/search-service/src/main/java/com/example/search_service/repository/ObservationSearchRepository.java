package com.example.search_service.repository;

import com.example.search_service.domain.dto.MetricValueDTO;
import com.example.search_service.domain.dto.response.MetricYearlySummaryDTO;
import com.example.search_service.domain.dto.response.YearlySummaryDTO;
import com.example.search_service.domain.entity.Observation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ObservationSearchRepository extends JpaRepository<Observation, Long>, JpaSpecificationExecutor<Observation> {
    @Query(value =
            "WITH RankedObservations AS (" +
                    "    SELECT o.*," +
                    "           ROW_NUMBER() OVER (PARTITION BY o.metric_id ORDER BY o.record_time DESC) as rn" +
                    "    FROM observations o" +
                    "    WHERE o.asset_id = :assetId" +
                    ")" +
                    "SELECT * FROM RankedObservations WHERE rn = 1",
            nativeQuery = true)
    List<Observation> findLatestObservationsForAsset(@Param("assetId") Long assetId);

    @Query("SELECT new com.example.search_service.domain.dto.response.YearlySummaryDTO(" +
            "    YEAR(o.recordTime), " +
            "    SUM(o.value)" +
            ") " +
            "FROM Observation o " +
            "JOIN o.metric m " +
            "WHERE m.category = :category AND m.unit = :unit " +
            "GROUP BY YEAR(o.recordTime) " +
            "ORDER BY YEAR(o.recordTime) ASC")
    List<YearlySummaryDTO> getYearlySummaryByCategoryAndUnit(
            @Param("category") String category,
            @Param("unit") String unit
    );

    @Query("SELECT new com.example.search_service.domain.dto.MetricValueDTO(" +
            "    m.name, " +
            "    o.value, " +
            "    m.unit" +
            ") " +
            "FROM Observation o " +
            "JOIN o.metric m ON o.metric.id = m.id " +
            "WHERE m.category = :category AND YEAR(o.recordTime) = :year")
    List<MetricValueDTO> getDetailedSummaryByCategoryAndYear(
            @Param("category") String category,
            @Param("year") Integer year
    );

    @Query("SELECT new com.example.search_service.domain.dto.response.MetricYearlySummaryDTO(" +
            "m.name, " +
            "YEAR(o.recordTime), " +
            "SUM(o.value), " +
            "m.unit" +
            ") " +
            "FROM Observation o JOIN o.metric m " +
            "WHERE m.category = :category " +
            "AND m.unit LIKE :unit " +
            "AND m.name LIKE :crop " +
            "AND m.name LIKE :aspect " +
            "GROUP BY m.name, YEAR(o.recordTime), m.unit " +
            "ORDER BY m.name ASC, YEAR(o.recordTime) ASC")
    List<MetricYearlySummaryDTO> searchAgricultureSummary(
            @Param("category") String category,
            @Param("unit") String unit,
            @Param("crop") String crop,
            @Param("aspect") String aspect
    );
}