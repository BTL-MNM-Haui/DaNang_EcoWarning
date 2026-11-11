package com.example.authservice.domain.mapper;

import com.example.authservice.domain.dto.request.RegisterUserRequest;
import com.example.authservice.domain.dto.response.UserResponse;
import com.example.authservice.domain.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public abstract class UserMapper {

    public abstract User toUser(RegisterUserRequest registerUserRequest);
    public abstract UserResponse toUserResponse(User user);
}

