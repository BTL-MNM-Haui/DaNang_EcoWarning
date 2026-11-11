package com.example.authservice.service.impl;

import com.example.authservice.domain.dto.request.SignInRequest;
import com.example.authservice.domain.dto.response.TokenResponse;
import com.example.authservice.domain.entity.User;
import com.example.authservice.exception.AppException;
import com.example.authservice.exception.ErrorDetail;
import com.example.authservice.repository.RedisRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.service.AuthService;
import com.example.authservice.service.JwtService;
import com.example.authservice.service.MailService;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.UnsupportedEncodingException;
import java.security.SecureRandom;
import java.sql.Timestamp;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final SpringTemplateEngine templateEngine;
    private final MailService mailService;
    private final RedisRepository redisRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.expiration.access:900000}")
    private Long accessTokenExpiration;

    @Value("${jwt.expiration.refresh:604800000}")
    private Long refreshTokenExpiration;

    @Value("${jwt.expiration.otp:120000}")
    private Long otpExpiration;

    @Override
    public TokenResponse getOtpSignIn(SignInRequest signInRequest) {
        User user = userRepository.findByEmail(signInRequest.getEmail())
                .orElseThrow(() -> new AppException(ErrorDetail.ERR_USER_UN_AUTHENTICATE));

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    signInRequest.getEmail(),
                    signInRequest.getPassword()
            ));
        } catch (Exception e) {
            log.error("Authentication failed for user: {}", signInRequest.getEmail());
            throw new AppException(ErrorDetail.ERR_USER_UN_AUTHENTICATE);
        }

        try {
            sendOtp(user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send OTP to: {}", user.getEmail(), e);
            throw new AppException(ErrorDetail.ERR_SEND_MAIL_FAILED);
        }

        var tokenContent = jwtService.generateToken(java.util.Map.of("token_use","otp"), user, otpExpiration);

        return TokenResponse.builder()
                .tokenContent(tokenContent)
                .expToken(new Timestamp(System.currentTimeMillis() + otpExpiration))
                .build();
    }

    @Override
    public TokenResponse verifyOtpSignIn(String otp, User user) {
        verifyOtp(user.getEmail(), otp);

        var tokenContent = jwtService.generateToken(java.util.Map.of("token_use","access","role",user.getRole()), user, accessTokenExpiration);
        var refreshToken = jwtService.generateToken(java.util.Map.of("token_use","refresh"), user, refreshTokenExpiration);

        return TokenResponse.builder()
                .tokenContent(tokenContent)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .userName(user.getEmail())
                .roleName(user.getRole())
                .expToken(new Timestamp(System.currentTimeMillis() + accessTokenExpiration))
                .expRefreshToken(new Timestamp(System.currentTimeMillis() + refreshTokenExpiration))
                .build();
    }

    @Override
    public void getOtpForgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorDetail.ERR_USER_NOT_EXISTED));

        try {
            sendOtp(user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send OTP for forgot password to: {}", email, e);
            throw new AppException(ErrorDetail.ERR_SEND_MAIL_FAILED);
        }
    }

    @Override
    public void verifyOtpForgotPassword(String otp, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorDetail.ERR_USER_NOT_EXISTED));

        verifyOtp(user.getEmail(), otp);

        redisRepository.set(user.getEmail() + "_VERIFIED", "true");
        redisRepository.setTimeToLive(user.getEmail() + "_VERIFIED", 5 * 60 * 1000L); // 5 minutes in ms
    }

    @Override
    public void changePasswordNoAuth(String newPassword, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorDetail.ERR_USER_NOT_EXISTED));

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new AppException(ErrorDetail.ERR_NEW_PASSWORD_SAME_AS_OLD);
        }

        Object verified = redisRepository.get(user.getEmail() + "_VERIFIED");
        if (verified == null || !"true".equals(verified.toString())) {
            throw new AppException(ErrorDetail.ERR_USER_SESSION_EXPIRED);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        redisRepository.delete(user.getEmail() + "_VERIFIED");

        log.info("Password reset successfully for user: {}", email);
    }

    @Override
    public void logout(String accessToken, String refreshToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new AppException(ErrorDetail.ERR_TOKEN_INVALID);
        }

        String username = jwtService.extractUsername(accessToken);
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new AppException(ErrorDetail.ERR_USER_NOT_EXISTED));

        Long accessTokenExpiration = jwtService.getExpirationToken(accessToken);
        redisRepository.set(accessToken, "logged_out");
        redisRepository.setTimeToLive(accessToken, accessTokenExpiration); // Already in milliseconds

        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                Long refreshTokenExpiration = jwtService.getExpirationToken(refreshToken);
                redisRepository.set(refreshToken, "logged_out");
                redisRepository.setTimeToLive(refreshToken, refreshTokenExpiration);
            } catch (Exception e) {
                log.warn("Failed to blacklist refresh token, continuing logout");
            }
        }

        String userTokenKey = "user_tokens:" + user.getId();
        redisRepository.set(userTokenKey, "logged_out");
        redisRepository.setTimeToLive(userTokenKey, 7 * 24 * 60 * 60 * 1000L); // 7 days in ms

        log.info("User logged out successfully: {}", username);
    }

    private void sendOtp(String email) throws MessagingException, UnsupportedEncodingException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorDetail.ERR_USER_NOT_EXISTED));

        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000); // Ensures 6 digits

        Context context = new Context();
        context.setVariable("code", code);
        context.setVariable("name", user.getFirstName() + " " + user.getLastName());
        String content = templateEngine.process("mail-otp", context);
        String subject = "Mã xác thực tài khoản";

        mailService.sendMail(subject, email, content, true);

        redisRepository.set(user.getEmail(), String.valueOf(code));
        redisRepository.setTimeToLive(user.getEmail(), 2 * 60 * 1000L); // 2 minutes in ms

        log.info("OTP sent successfully to: {}", email);
    }

    private void verifyOtp(String email, String otp) {
        Object storedOtp = redisRepository.get(email);

        if (storedOtp == null) {
            throw new AppException(ErrorDetail.ERR_OTP_EXPIRED);
        }

        if (otp == null || !otp.equals(storedOtp.toString())) {
            throw new AppException(ErrorDetail.ERR_OTP_INVALID);
        }

        redisRepository.delete(email);

        log.info("OTP verified successfully for: {}", email);
    }

    @Override
    public TokenResponse refreshToken(String refreshToken) {
        if(refreshToken == null || refreshToken.isBlank()) {
            throw new AppException(ErrorDetail.ERR_TOKEN_INVALID);
        }

        Object blacklisted = redisRepository.get(refreshToken);
        if(blacklisted != null) {
            throw new AppException(ErrorDetail.ERR_TOKEN_INVALID);
        }

        String username;
        try {
            username = jwtService.extractUsername(refreshToken);
            if (!"refresh".equals(jwtService.extractClaim(refreshToken, claims -> claims.get("token_use", String.class)))) throw new AppException(ErrorDetail.ERR_TOKEN_INVALID);
            if (jwtService.isTokenExpired(refreshToken)) {
                throw new AppException(ErrorDetail.ERR_TOKEN_EXPIRED);
            }
        } catch (AppException e) {
            log.error("Failed to validate refresh token", e);
            throw new AppException(ErrorDetail.ERR_TOKEN_INVALID);
        }

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new AppException(ErrorDetail.ERR_USER_NOT_EXISTED));

        var newAccessToken = jwtService.generateToken(java.util.Map.of("token_use","access","role",user.getRole()), user, accessTokenExpiration);

        log.info("Access token refreshed successfully for user: {}", username);

        return TokenResponse.builder()
                .tokenContent(newAccessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .userName(user.getEmail())
                .roleName(user.getRole())
                .expToken(new Timestamp(System.currentTimeMillis() + accessTokenExpiration))
                .build();
    }
}
