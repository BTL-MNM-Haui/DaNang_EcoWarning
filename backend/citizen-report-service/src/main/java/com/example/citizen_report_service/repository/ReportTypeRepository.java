package com.example.citizen_report_service.repository;

import com.example.citizen_report_service.domain.entity.ReportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReportTypeRepository extends JpaRepository<ReportType, Long> {
    Optional<ReportType> findByTypeCode(String typeCode);
}
