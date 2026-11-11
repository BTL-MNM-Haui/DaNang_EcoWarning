package com.example.authservice.service;

import com.example.authservice.domain.dto.request.SignInRequest;
import com.example.authservice.domain.dto.response.TokenResponse;
import com.example.authservice.domain.entity.User;

public interface AuthService {
    TokenResponse getOtpSignIn(SignInRequest signInRequest);
    
    TokenResponse verifyOtpSignIn(String otp, User user);
    
    void getOtpForgotPassword(String email);
    
    void verifyOtpForgotPassword(String otp, String email);
    
    void changePasswordNoAuth(String newPassword, String email);
    
    void logout(String accessToken, String refreshToken);

    TokenResponse refreshToken(String refreshToken);
}
