package com.example.authservice.config;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

@Component
public class LocalPasswordLoginPolicy {
    private final boolean localDemo;
    private final Set<String> accounts;

    public LocalPasswordLoginPolicy(Environment environment,
            @Value("${auth.local-password-login.accounts:}") String accounts) {
        this.localDemo = environment.acceptsProfiles(Profiles.of("local-demo"));
        this.accounts = Arrays.stream(accounts.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).map(s -> s.toLowerCase(Locale.ROOT)).collect(Collectors.toUnmodifiableSet());
    }

    public boolean allows(String email) {
        return localDemo && email != null && accounts.contains(email.toLowerCase(Locale.ROOT));
    }
}
