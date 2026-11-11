package com.example.collector_data_service.constant;

public class LogMessage {

    private LogMessage() {
    }

    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILED = "FAILED";

    // DatabaseInitializer
    public static final String ASSETS_ALREADY_INITIALIZED = "Assets data already initialized. Skipping.";
    public static final String OBSERVATIONS_ALREADY_INITIALIZED = "Observation data already initialized. Skipping.";
    public static final String DATABASE_CONNECTION_FAILED = "DATABASE CONNECTION FAILED. Cannot proceed with data initialization.";
    public static final String ASSETS_INIT_START = "Starting Assets initialization from CSV files...";
    public static final String ASSETS_INIT_FINISHED = "Assets initialization finished for run ID: {}";
    public static final String OBSERVATIONS_INIT_START = "Starting Observations initialization...";
    public static final String OBSERVATIONS_INIT_FINISHED = "Observations initialization finished for run ID: {}";

    // Observation Initialization
    public static final String CREATE_NEW_METRIC = "Creating new Metric: '{}' in category '{}'";
    public static final String SUCCESSFULLY_PARSED = "Successfully parsed {}. Processed: {}, Inserted: {}";
    public static final String SUCCESSFULLY_PARSED_RIVER_WATER_LEVEL = "Successfully parsed River Water Levels {}. Processed rows: {}, Inserted observations: {}";
    public static final String SUCCESSFULLY_PARSED_ENV_STATS = "Successfully parsed Environmental Stats {}. Processed rows: {}, Inserted observations: {}";
    public static final String SUCCESSFULLY_PARSED_DISASTER_DAMAGE = "Successfully parsed Disaster Damage {}. Processed rows: {}, Inserted observations: {}";

    // Asset Initialization
    public static final String ERR_PROCESS_ASSET_RECORD_FAILED = "Failed to process asset record {} for {}: {}";


    // safeParse
    public static final String ERR_FILE_PARSE_FAILED = "Failed to parse file {}: {}";
    public static final String ERR_FILE_NOT_FOUND_IN_RESOURCES = "File not found in resources: %s";
    public static final String ERR_LOAD_DOUBLE_FAIL = "Could not parse double value: '{}'";
    public static final String ERR_ASSET_NOT_FOUND_FOR_RIVER = "Asset not found for river: '{}'. Skipping row.";
    public static final String ERR_PARSE_COORDINATE_FOR_ASSET = "Could not parse coordinates '{}' for asset: {}";


}