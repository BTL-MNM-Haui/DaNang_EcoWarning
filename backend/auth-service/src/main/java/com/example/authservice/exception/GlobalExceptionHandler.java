package com.example.authservice.exception;

import com.example.authservice.base.RestData;
import com.example.authservice.base.VsResponseUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.mail.MessagingException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;


@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {


    @ExceptionHandler(AppException.class)
    public ResponseEntity<RestData<?>> handleAppException(AppException ex) {
        ErrorDetail errorDetail = ex.getErrorDetail();
        int errorCode = errorDetail != null ? errorDetail.getCode() : 500;
        String errorMessage = errorDetail != null ? errorDetail.getMessage() : "Internal Server Error";
        
        log.error("[AppException] Code: {}, Message: {}, ErrorDetail: {}", 
                errorCode, errorMessage, errorDetail != null ? errorDetail.name() : "UNKNOWN");
        
        HttpStatus httpStatus = getHttpStatusFromCode(errorCode);
        return VsResponseUtil.error(httpStatus, errorMessage);
    }

    /**
     * Handle validation errors
     * Xử lý lỗi validation từ @Valid annotation
     * Trả về danh sách chi tiết các field bị lỗi và message tương ứng
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<RestData<?>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        
        // Thu thập tất cả các lỗi validation
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.error("[ValidationException] Validation failed for {} fields. Details: {}", 
                errors.size(), errors);

        return VsResponseUtil.error(HttpStatus.BAD_REQUEST, errors);
    }

    /**
     * Handle JWT token exceptions
     * Xử lý trường hợp JWT token đã hết hạn
     */
    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<RestData<?>> handleExpiredJwtException(ExpiredJwtException ex) {
        log.error("[ExpiredJwtException] JWT token has expired. Claims: {}", 
                ex.getClaims() != null ? ex.getClaims().getSubject() : "N/A");
        
        return VsResponseUtil.error(HttpStatus.UNAUTHORIZED, "Token đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.");
    }

    /**
     * Xử lý JWT token không hợp lệ (malformed hoặc signature sai)
     */
    @ExceptionHandler({MalformedJwtException.class, SignatureException.class})
    public ResponseEntity<RestData<?>> handleInvalidJwtException(Exception ex) {
        String exceptionType = ex.getClass().getSimpleName();
        log.error("[{}] Invalid JWT token. Reason: {}", exceptionType, ex.getMessage());
        
        return VsResponseUtil.error(HttpStatus.UNAUTHORIZED, "Token không hợp lệ. Vui lòng đăng nhập lại.");
    }

    /**
     * Handle authentication exceptions
     * Xử lý lỗi xác thực người dùng (sai email/password)
     * KHÔNG expose thông tin chi tiết vì lý do bảo mật
     */
    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<RestData<?>> handleAuthenticationException(Exception ex) {
        String exceptionType = ex.getClass().getSimpleName();
        log.error("[{}] Authentication failed. Message: {}", exceptionType, ex.getMessage());
        
        return VsResponseUtil.error(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
    }

    /**
     * Handle mail sending exceptions
     * Xử lý lỗi khi gửi email (MessagingException, encoding issues)
     */
    @ExceptionHandler({MessagingException.class, UnsupportedEncodingException.class})
    public ResponseEntity<RestData<?>> handleMailException(Exception ex) {
        String exceptionType = ex.getClass().getSimpleName();
        log.error("[{}] Mail sending failed. Error: {}", exceptionType, ex.getMessage(), ex);
        
        return VsResponseUtil.error(HttpStatus.INTERNAL_SERVER_ERROR, "Gửi email thất bại. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.");
    }

    /**
     * Handle AccessDeniedException
     * Xử lý khi người dùng không có quyền truy cập resource (role không đủ)
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<RestData<?>> handleAccessDeniedException(AccessDeniedException ex) {
        log.error("[AccessDeniedException] Access denied. Message: {}", ex.getMessage());
        
        return VsResponseUtil.error(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập tài nguyên này.");
    }

    /**
     * Handle InsufficientAuthenticationException
     * Xử lý khi người dùng chưa đăng nhập hoặc authentication không đủ
     */
    @ExceptionHandler(InsufficientAuthenticationException.class)
    public ResponseEntity<RestData<?>> handleInsufficientAuthenticationException(InsufficientAuthenticationException ex) {
        log.error("[InsufficientAuthenticationException] Insufficient authentication. Message: {}", ex.getMessage());
        
        return VsResponseUtil.error(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để truy cập tài nguyên này.");
    }

    /**
     * Handle AuthenticationException (general Spring Security authentication errors)
     * Xử lý các lỗi xác thực chung từ Spring Security
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<RestData<?>> handleSpringAuthenticationException(AuthenticationException ex) {
        String exceptionType = ex.getClass().getSimpleName();
        log.error("[{}] Spring Security authentication error. Message: {}", exceptionType, ex.getMessage());
        
        return VsResponseUtil.error(HttpStatus.UNAUTHORIZED, "Xác thực thất bại. Vui lòng đăng nhập lại.");
    }

    /**
     * Handle MissingServletRequestParameterException
     * Xử lý khi request thiếu required parameter
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<RestData<?>> handleMissingParams(MissingServletRequestParameterException ex) {
        log.error("[MissingServletRequestParameterException] Missing parameter '{}' of type '{}'", 
                ex.getParameterName(), ex.getParameterType());
        
        String message = String.format("Thiếu tham số bắt buộc: '%s'", ex.getParameterName());
        return VsResponseUtil.error(HttpStatus.BAD_REQUEST, message);
    }

    /**
     * Handle MethodArgumentTypeMismatchException
     * Xử lý khi type của parameter không khớp (ví dụ: truyền string vào parameter kiểu int)
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<RestData<?>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String requiredType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown";
        log.error("[MethodArgumentTypeMismatchException] Type mismatch for parameter '{}'. Expected type: {}, Provided value: '{}'",
                ex.getName(), requiredType, ex.getValue());
        
        String message = String.format("Kiểu dữ liệu không hợp lệ cho tham số '%s'. Yêu cầu kiểu: %s", 
                ex.getName(), requiredType);
        return VsResponseUtil.error(HttpStatus.BAD_REQUEST, message);
    }

    /**
     * Handle generic exceptions
     * Xử lý tất cả các exception chưa được catch bởi các handler cụ thể
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<RestData<?>> handleGenericException(Exception ex) {
        String exceptionType = ex.getClass().getSimpleName();
        log.error("[{}] Unexpected error occurred. Message: {}. Cause: {}", 
                exceptionType, ex.getMessage(), ex.getCause() != null ? ex.getCause().getMessage() : "N/A", ex);
        
        return VsResponseUtil.error(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống không xác định. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.");
    }

    private HttpStatus getHttpStatusFromCode(int code) {
        return switch (code) {
            case 400 -> HttpStatus.BAD_REQUEST;
            case 401 -> HttpStatus.UNAUTHORIZED;
            case 403 -> HttpStatus.FORBIDDEN;
            case 404 -> HttpStatus.NOT_FOUND;
            case 500 -> HttpStatus.INTERNAL_SERVER_ERROR;
            default -> HttpStatus.BAD_REQUEST;
        };
    }
}
