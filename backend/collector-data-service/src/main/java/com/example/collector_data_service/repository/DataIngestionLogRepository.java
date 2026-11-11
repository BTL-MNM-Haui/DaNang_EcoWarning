package com.example.collector_data_service.repository;

import com.example.collector_data_service.domain.entity.DataIngestionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DataIngestionLogRepository extends JpaRepository<DataIngestionLog, Long> {
}
