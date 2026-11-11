package com.example.citizen_report_service.repository;

import org.springframework.stereotype.Repository;

@Repository
public interface RedisRepository {
    Object get(String key);
}
