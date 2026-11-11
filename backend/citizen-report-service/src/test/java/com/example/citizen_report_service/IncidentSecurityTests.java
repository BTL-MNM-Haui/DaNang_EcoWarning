package com.example.citizen_report_service;

import static org.junit.jupiter.api.Assertions.*;

import com.example.citizen_report_service.domain.validator.ReportValidator;
import com.example.citizen_report_service.security.JwtTokenValidator;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class IncidentSecurityTests {
  @Test
  void onlyAccessTokensCanAuthenticateReports() {
    var key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    var validator = new JwtTokenValidator();
    ReflectionTestUtils.setField(
        validator, "SECRET_KEY", Base64.getEncoder().encodeToString(key.getEncoded()));
    for (String use : List.of("access", "otp", "refresh")) {
      String token =
          Jwts.builder()
              .setSubject("fixture@example.invalid")
              .claim("token_use", use)
              .claim("role", "ROLE_ADMIN")
              .setExpiration(new Date(System.currentTimeMillis() + 60000))
              .signWith(key)
              .compact();
      assertEquals(use.equals("access"), validator.validateToken(token));
    }
    var other = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    assertFalse(
        validator.validateToken(
            Jwts.builder()
                .setSubject("fixture@example.invalid")
                .claim("token_use", "access")
                .signWith(other)
                .compact()));
  }

  @Test
  void activeReportsCanHaveNoEndTimeButCannotEndBeforeTheyStart() {
    var validator = new ReportValidator();
    var start = OffsetDateTime.now().minusHours(1);
    assertDoesNotThrow(() -> validator.validateTime(start, null));
    assertThrows(
        RuntimeException.class, () -> validator.validateTime(start, start.minusMinutes(1)));
    assertThrows(
        RuntimeException.class, () -> validator.validateCoordinates(null, new BigDecimal("108.2")));
  }
}
