package com.example.authservice;

import com.example.authservice.controller.UserController;
import com.example.authservice.domain.entity.User;
import com.example.authservice.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class UserProfileTests {
    @Test void profileExposesOnlyProfileFieldsAndNeverPasswordHash() throws Exception {
        var user = new User();
        user.setId("fixture"); user.setEmail("fixture@example.invalid");
        user.setFirstName("First"); user.setLastName("Last"); user.setRole("ROLE_USER");
        user.setPassword("private-password-hash");
        var response = new UserController(mock(UserService.class)).getProfile(user);
        var json = new ObjectMapper().writeValueAsString(response.getBody());
        assertThat(json).contains("fixture@example.invalid", "firstName", "ROLE_USER");
        assertThat(json).doesNotContain("password", "private-password-hash", "authorities");
    }
}
