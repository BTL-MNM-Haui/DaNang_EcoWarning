package com.example.authservice.service;

import com.example.authservice.domain.dto.request.ChangePasswordAuthRequest;
import com.example.authservice.domain.dto.request.ProfileUpdateRequest;
import com.example.authservice.domain.dto.request.RegisterUserRequest;
import com.example.authservice.domain.dto.response.UserResponse;
import com.example.authservice.domain.entity.User;

public interface UserService {
    void register(RegisterUserRequest registerUserRequest);
    
    UserResponse updateProfile(ProfileUpdateRequest profileUpdateRequest, User user);
    
    void changePassword(ChangePasswordAuthRequest request, User user);
}
