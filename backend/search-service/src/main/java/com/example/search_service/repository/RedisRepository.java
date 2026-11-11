package com.example.search_service.repository;

import org.springframework.stereotype.Repository;

@Repository
public interface RedisRepository {
    Object get(String key);
}
