package com.example.authservice.controller;

import com.example.authservice.base.RestApiV1;
import com.example.authservice.base.RestData;
import com.example.authservice.base.VsResponseUtil;
import com.example.authservice.constant.AuthUrlConstant;
import com.example.authservice.domain.dto.request.ChangePasswordAuthRequest;
import com.example.authservice.domain.dto.request.ProfileUpdateRequest;
import com.example.authservice.domain.dto.response.UserResponse;
import com.example.authservice.domain.entity.User;
import com.example.authservice.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestApiV1
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Management", description = "User profile and settings APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @PutMapping(AuthUrlConstant.User.PROFILE)
    @Operation(summary = "Update profile", description = "Update user profile information")
    public ResponseEntity<RestData<?>> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            @AuthenticationPrincipal User user
    ) {
        UserResponse userResponse = userService.updateProfile(request, user);
        return VsResponseUtil.success(userResponse);
    }

    @PutMapping(AuthUrlConstant.User.CHANGE_PASSWORD)
    @Operation(summary = "Change password", description = "Change user password")
    public ResponseEntity<RestData<?>> changePassword(
            @Valid @RequestBody ChangePasswordAuthRequest request,
            @AuthenticationPrincipal User user
    ) {
        userService.changePassword(request, user);
        return VsResponseUtil.success("Đổi mật khẩu thành công");
    }

    @GetMapping(AuthUrlConstant.User.PROFILE)
    @Operation(summary = "Get profile", description = "Get current user profile")
    public ResponseEntity<RestData<?>> getProfile(@AuthenticationPrincipal User user) {
        return VsResponseUtil.success(user);
    }
}
