package com.example.citizen_report_service.constant;

import java.math.BigDecimal;

public class CommonConstant {
    public static final BigDecimal DANANG_MIN_LAT = new BigDecimal("15.9000");
    public static final BigDecimal DANANG_MAX_LAT = new BigDecimal("16.3000");
    public static final BigDecimal DANANG_MIN_LON = new BigDecimal("107.8000");
    public static final BigDecimal DANANG_MAX_LON = new BigDecimal("108.4000");

    public static final long IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    public static final String IMAGE_TYPE_JPEG = "image/jpeg";
    public static final String IMAGE_TYPE_PNG = "image/png";
    public static final String IMAGE_TYPE_WEBP = "image/webp";
}
