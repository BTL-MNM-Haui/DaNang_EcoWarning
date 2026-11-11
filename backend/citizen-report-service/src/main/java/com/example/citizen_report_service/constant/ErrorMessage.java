package com.example.citizen_report_service.constant;

public class ErrorMessage {
    public static final String ERR_EXCEPTION_GENERAL = "exception.general";
    public static final String UNAUTHORIZED = "exception.unauthorized";
    public static final String FORBIDDEN = "exception.forbidden";
    public static final String BAD_REQUEST = "exception.bad.request";

    public static final String ERR_UPLOAD_IMAGE_FAIL = "exception.upload.image.fail";
    public static final String ERR_IMAGE_SIZE_TOO_LARGE = "exception.image.size.too.large";
    public static final String ERR_IMAGE_TYPE_UNSUPPORTED= "exception.image.size.unsupported";

    public static final String ERR_INVALID_REPORT= "exception.invalid.report: ";
    public static final String ERR_DETAILS_NOT_VALID= "exception.details.not.valid: ";
    public static final String ERR_PARSE_JSON_FAIL = "exception.parse.json.fail";

    public static final String ERR_COORDINATES_NULL = "exception.coordinates.null";
    public static final String ERR_COORDINATES_NOT_VALID = "exception.coordinates.not.valid";

    public static final String ERR_REPORT_TIME_NOT_VALID = "exception.report.time.not.valid";
    public static final String ERR_REPORT_START_TIME_NOT_FOUND = "exception.report.start.time.not.found";
    public static final String ERR_REPORT_TIME_TOO_OLD= "exception.report.time.too.old";

    public static final String ERR_REPORT_DETAILS_TOO_LONG = "exception.report.detail.too.long";
}
