package com.example.citizen_report_service.domain.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = SafeTextValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeText {
    String message() default "Nội dung chứa ký tự không hợp lệ hoặc mã độc";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}