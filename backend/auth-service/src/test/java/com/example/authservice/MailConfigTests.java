package com.example.authservice;

import com.example.authservice.config.MailConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import static org.assertj.core.api.Assertions.assertThat;

class MailConfigTests {
    private final ApplicationContextRunner context = new ApplicationContextRunner()
            .withUserConfiguration(MailConfig.class)
            .withPropertyValues("spring.mail.username=test@example.invalid", "spring.mail.password=local");

    @Test void smtpKeepsTlsAndBoundedTimeoutsByDefault() {
        context.run(c -> {
            var props = c.getBean(JavaMailSenderImpl.class).getJavaMailProperties();
            assertThat(props.getProperty("mail.smtp.auth")).isEqualTo("true");
            assertThat(props.getProperty("mail.smtp.starttls.required")).isEqualTo("true");
            assertThat(props.getProperty("mail.smtp.connectiontimeout")).isEqualTo("5000");
            assertThat(props.getProperty("mail.smtp.timeout")).isEqualTo("5000");
            assertThat(props.getProperty("mail.smtp.writetimeout")).isEqualTo("5000");
        });
    }

    @Test void explicitLocalSmtpConfigurationIsRespected() {
        context.withPropertyValues("spring.mail.host=mailpit", "spring.mail.port=1025",
                "spring.mail.properties.mail.smtp.auth=false",
                "spring.mail.properties.mail.smtp.starttls.enable=false",
                "spring.mail.properties.mail.smtp.starttls.required=false")
                .run(c -> {
                    var sender = c.getBean(JavaMailSenderImpl.class);
                    assertThat(sender.getHost()).isEqualTo("mailpit");
                    assertThat(sender.getPort()).isEqualTo(1025);
                    assertThat(sender.getJavaMailProperties()).containsEntry("mail.smtp.auth", "false")
                            .containsEntry("mail.smtp.starttls.enable", "false")
                            .containsEntry("mail.smtp.starttls.required", "false");
                });
    }
}
