package com.example.authservice.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorDetail {
    ERR_USER_UN_AUTHENTICATE(401, "Email hoặc mật khẩu không chính xác"),
    ERR_TOKEN_INVALID(401, "Token không hợp lệ"),
    ERR_TOKEN_EXPIRED(401, "Token đã hết hạn"),
    ERR_USER_SESSION_EXPIRED(401, "Phiên làm việc đã hết hạn, vui lòng thử lại"),
    
    ERR_USER_NOT_EXISTED(404, "Người dùng không tồn tại"),
    
    ERR_USER_EMAIL_EXISTED(400, "Email đã được sử dụng"),
    ERR_OLD_PASSWORD_INCORRECT(400, "Mật khẩu cũ không chính xác"),
    ERR_NEW_PASSWORD_SAME_AS_OLD(400, "Mật khẩu mới không được trùng với mật khẩu cũ"),
    ERR_PASSWORD_CONFIRM_NOT_MATCH(400, "Mật khẩu xác nhận không khớp"),
    ERR_OTP_INVALID(400, "Mã OTP không chính xác hoặc đã hết hạn"),
    ERR_OTP_EXPIRED(400, "Mã OTP đã hết hạn"),
    
    ERR_INTERNAL_SERVER(500, "Lỗi hệ thống, vui lòng thử lại sau"),
    ERR_SEND_MAIL_FAILED(500, "Gửi email thất bại, vui lòng thử lại");

    private final int code;
    private final String message;
}
