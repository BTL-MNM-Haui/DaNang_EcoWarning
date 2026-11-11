package com.example.authservice.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AppException extends RuntimeException {
    private ErrorDetail errorDetail;

    public int getCode() {
        return errorDetail != null ? errorDetail.getCode() : 500;
    }

    @Override
    public String getMessage() {
        return errorDetail != null ? errorDetail.getMessage() : "Internal Server Error";
    }
}
