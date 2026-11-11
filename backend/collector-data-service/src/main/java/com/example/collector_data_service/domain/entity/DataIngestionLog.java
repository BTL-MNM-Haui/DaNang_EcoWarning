package com.example.collector_data_service.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "data_ingestion_logs")
@Getter
@Setter
public class DataIngestionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private UUID runId;

    private String fileName;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String status;

    private int recordsProcessed;

    private int recordsInserted;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;
}