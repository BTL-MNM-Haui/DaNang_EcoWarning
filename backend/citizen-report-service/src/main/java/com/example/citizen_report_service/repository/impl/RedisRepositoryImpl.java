package com.example.citizen_report_service.repository.impl;

import com.example.citizen_report_service.repository.RedisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisRepositoryImpl implements RedisRepository{

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public Object get(String key){
        return redisTemplate.opsForValue().get(key);
    }
}
