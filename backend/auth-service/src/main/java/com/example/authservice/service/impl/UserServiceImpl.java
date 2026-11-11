package com.example.authservice.service.impl;

import com.example.authservice.domain.dto.request.ChangePasswordAuthRequest;
import com.example.authservice.domain.dto.request.ProfileUpdateRequest;
import com.example.authservice.domain.dto.request.RegisterUserRequest;
import com.example.authservice.domain.dto.response.UserResponse;
import com.example.authservice.domain.entity.User;
import com.example.authservice.domain.mapper.UserMapper;
import com.example.authservice.exception.AppException;
import com.example.authservice.exception.ErrorDetail;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void register(RegisterUserRequest registerUserRequest) {
        if (userRepository.findByEmail(registerUserRequest.getEmail()).isPresent()) {
            throw new AppException(ErrorDetail.ERR_USER_EMAIL_EXISTED);
        }
        
        User user = userMapper.toUser(registerUserRequest);
        
        user.setPassword(passwordEncoder.encode(registerUserRequest.getPassword()));
        user.setRole("ROLE_USER");
        
        userRepository.save(user);
        
        log.info("User registered successfully: {}", registerUserRequest.getEmail());
    }

    @Override
    public UserResponse updateProfile(ProfileUpdateRequest profileUpdateRequest, User user) {
        boolean updated = false;
        
        if (profileUpdateRequest.getFirstName() != null && !profileUpdateRequest.getFirstName().isBlank()) {
            user.setFirstName(profileUpdateRequest.getFirstName().trim());
            updated = true;
        }
        
        if (profileUpdateRequest.getLastName() != null && !profileUpdateRequest.getLastName().isBlank()) {
            user.setLastName(profileUpdateRequest.getLastName().trim());
            updated = true;
        }
        
        if (profileUpdateRequest.getPhone() != null && !profileUpdateRequest.getPhone().isBlank()) {
            user.setPhone(profileUpdateRequest.getPhone().trim());
            updated = true;
        }
        
        if (updated) {
            userRepository.save(user);
            log.info("Profile updated for user: {}", user.getEmail());
        }
        
        return userMapper.toUserResponse(user);
    }

    @Override
    public void changePassword(ChangePasswordAuthRequest request, User user) {
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorDetail.ERR_OLD_PASSWORD_INCORRECT);
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AppException(ErrorDetail.ERR_NEW_PASSWORD_SAME_AS_OLD);
        }
        
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorDetail.ERR_PASSWORD_CONFIRM_NOT_MATCH);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        log.info("Password changed successfully for user: {}", user.getEmail());
    }
}