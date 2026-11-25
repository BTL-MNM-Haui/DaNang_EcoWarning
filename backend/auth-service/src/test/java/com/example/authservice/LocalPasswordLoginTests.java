package com.example.authservice;

import com.example.authservice.config.LocalPasswordLoginPolicy;
import com.example.authservice.domain.dto.request.SignInRequest;
import com.example.authservice.domain.entity.User;
import com.example.authservice.exception.AppException;
import com.example.authservice.repository.RedisRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.service.*;
import com.example.authservice.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.context.Context;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LocalPasswordLoginTests {
    @Test void allowlistNeedsExplicitLocalProfileAndExactAccount() {
        var env = new MockEnvironment();
        var accounts = "admin@example.test,user@example.test";
        assertFalse(new LocalPasswordLoginPolicy(env, accounts).allows("admin@example.test"));
        env.setActiveProfiles("docker", "local-demo");
        var policy = new LocalPasswordLoginPolicy(env, accounts);
        assertTrue(policy.allows("admin@example.test"));
        assertTrue(policy.allows("user@example.test"));
        assertFalse(policy.allows("admin@example.test.evil"));
        assertFalse(policy.allows(null));
        assertFalse(new LocalPasswordLoginPolicy(env, "").allows("admin@example.test"));
    }

    private final UserRepository users = mock(UserRepository.class);
    private final JwtService jwt = mock(JwtService.class);
    private final AuthenticationManager authentication = mock(AuthenticationManager.class);
    private final MailService mail = mock(MailService.class);
    private final RedisRepository redis = mock(RedisRepository.class);
    private final SpringTemplateEngine template = mock(SpringTemplateEngine.class);
    private final User user = new User();

    private AuthServiceImpl service(boolean allowed) {
        user.setId("local-fixture"); user.setEmail("user@example.test"); user.setRole("ROLE_USER");
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(template.process(eq("mail-otp"), any(Context.class))).thenReturn("OTP template");
        when(jwt.generateToken(anyMap(), same(user), anyLong())).thenAnswer(call -> call.<java.util.Map<String,Object>>getArgument(0).get("token_use") + "-token");
        var env = new MockEnvironment(); env.setActiveProfiles("local-demo");
        var policy = new LocalPasswordLoginPolicy(env, allowed ? user.getEmail() : "");
        var service = new AuthServiceImpl(users, jwt, authentication, template, mail, redis, mock(PasswordEncoder.class), policy);
        ReflectionTestUtils.setField(service, "accessTokenExpiration", 900000L);
        ReflectionTestUtils.setField(service, "refreshTokenExpiration", 604800000L);
        ReflectionTestUtils.setField(service, "otpExpiration", 120000L);
        return service;
    }

    @Test void selectedAccountStillAuthenticatesPasswordAndKeepsDatabaseRole() {
        var service = service(true);
        var response = service.getOtpSignIn(new SignInRequest(user.getEmail(), "correct"));
        verify(authentication).authenticate(any());
        assertFalse(response.getOtpRequired());
        assertEquals("access-token", response.getTokenContent());
        assertEquals("refresh-token", response.getRefreshToken());
        assertEquals("ROLE_USER", response.getRoleName());
        verifyNoInteractions(mail, redis);
    }

    @Test void incorrectPasswordCannotUsePasswordOnlyLogin() {
        var service = service(true);
        when(authentication.authenticate(any())).thenThrow(new BadCredentialsException("wrong"));
        assertThrows(AppException.class, () -> service.getOtpSignIn(new SignInRequest(user.getEmail(), "wrong")));
        verifyNoInteractions(jwt, mail, redis);
    }

    @Test void otherAccountsStillReceiveOnlyOtpChallenge() throws Exception {
        var service = service(false);
        var response = service.getOtpSignIn(new SignInRequest(user.getEmail(), "correct"));
        assertTrue(response.getOtpRequired());
        assertEquals("otp-token", response.getTokenContent());
        assertNull(response.getRefreshToken());
        assertNull(response.getRoleName());
        verify(mail).sendMail(anyString(), eq(user.getEmail()), anyString(), eq(true));
    }

    @Test void selectedAccountStillNeedsOtpForPasswordRecovery() throws Exception {
        var service = service(true);
        service.getOtpForgotPassword(user.getEmail());
        verify(mail).sendMail(anyString(), eq(user.getEmail()), anyString(), eq(true));
        assertThrows(AppException.class, () -> service.changePasswordNoAuth("new-password", user.getEmail()));
    }
}
