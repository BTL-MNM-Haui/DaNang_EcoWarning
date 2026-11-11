package com.example.citizen_report_service.constant;

public class LogMessage {

    private LogMessage() {
    }

    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILED = "FAILED";

    // Init Report Type
    public static final String REPORT_TYPE_ALREADY_INITIALIZED = "ReportTypes already initialized. Skipping...";
    public static final String REPORT_TYPE_INIT_START = "Starting init report types.";
    public static final String REPORT_TYPE_INIT_FINISHED = "Finished init report types.";

    // Error Logging in DTO Layer
    public static final String REPORT_DESCRIPTION_NOT_SAFE = "Report description contain unsafe characters";
    public static final String REPORT_DESCRIPTION_TOO_LONG = "Report description is over 500 characters";

    public static final String REPORT_TIME_NOT_VALID = "Report time can not in future";

    public static final String REPORT_TYPE_EMPTY = "Report type is empty";
}