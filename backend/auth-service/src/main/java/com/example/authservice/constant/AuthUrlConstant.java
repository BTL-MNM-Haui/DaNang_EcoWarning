package com.example.authservice.constant;

public class AuthUrlConstant {

    public static class Auth {
        public static final String PREFIX = "/auth";

        public static final String REGISTER = PREFIX + "/register";
        public static final String OTP_SIGN_IN = PREFIX + "/otp-sign-in";
        public static final String VERIFY_SIGN_IN = PREFIX + "/verify-sign-in/{otp}";

        public static final String FORGOT_PASSWORD = PREFIX + "/forgot-password";
        public static final String VERIFY_FORGOT_PASSWORD = PREFIX + "/verify-forgot-password/{otp}";
        public static final String RESET_PASSWORD = PREFIX + "/reset-password";

        public static final String TOKEN_INFO = PREFIX + "/token";
        public static final String LOGOUT = PREFIX + "/logout";
        public static final String REFRESH_TOKEN = PREFIX + "/refresh-token";
    }

    public static class User {
        public static final String PREFIX = "/user";

        public static final String PROFILE = PREFIX + "/profile";
        public static final String CHANGE_PASSWORD = PREFIX + "/change-password";
    }

}
