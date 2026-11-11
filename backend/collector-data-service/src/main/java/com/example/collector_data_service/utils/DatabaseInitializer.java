package com.example.collector_data_service.utils;

import com.example.collector_data_service.constant.DataConstant;
import com.example.collector_data_service.constant.FileNameConstant;
import com.example.collector_data_service.constant.LogMessage;
import com.example.collector_data_service.domain.entity.DataIngestionLog;
import com.example.collector_data_service.helper.ParseResult;
import com.example.collector_data_service.repository.AssetRepository;
import com.example.collector_data_service.repository.DataIngestionLogRepository;
import com.example.collector_data_service.repository.ObservationRepository;
import com.example.collector_data_service.service.AssetInitializationService;
import com.example.collector_data_service.service.ObservationInitializationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final AssetRepository assetRepository;
    private final DataIngestionLogRepository logRepository;
    private final ObservationRepository observationRepository;

    private final AssetInitializationService assetInitService;
    private final ObservationInitializationService observationInitService;

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    @Override
    public void run(String... args) {
        try {
            if (assetRepository.count() > 0) {
                log.info(LogMessage.ASSETS_ALREADY_INITIALIZED);
                return;
            }

            if (observationRepository.count() > 0) {
                log.info(LogMessage.OBSERVATIONS_ALREADY_INITIALIZED);
                return;
            }
        } catch (DataAccessResourceFailureException e) {
            log.error(LogMessage.DATABASE_CONNECTION_FAILED, e);
            return;
        }

        final UUID runId = UUID.randomUUID();

        // ==== ASSET ====
        log.info(LogMessage.ASSETS_INIT_START);

        safeParse(runId, FileNameConstant.ENV_PONDS_LAKES, assetInitService::parseAndSavePondsAndLakes);
        safeParse(runId, FileNameConstant.ENV_IRRIGATION_LAKES, assetInitService::parseAndSaveIrrigationLakes);
        safeParse(runId, FileNameConstant.ENV_RIVERS, assetInitService::parseAndSaveRivers);

        safeParse(runId, FileNameConstant.DISASTER_LANDSLIDES, assetInitService::parseAndSaveLandslideAreas);

        safeParse(runId, FileNameConstant.PREV_FLOOD_TOWERS, assetInitService::parseAndSaveFloodWarningTowers);
        safeParse(runId, FileNameConstant.PREV_AUTO_FLOOD_STATIONS, assetInitService::parseAndSaveAutoFloodWarningStations);
        safeParse(runId, FileNameConstant.PREV_RAIN_STATIONS, assetInitService::parseAndSaveRainStations);
        safeParse(runId, FileNameConstant.PREV_STORM_SHELTERS, assetInitService::parseAndSaveStormShelters);
        safeParse(runId, FileNameConstant.PREV_COASTAL_STATIONS, assetInitService::parseAndSaveCoastalWarningStations);

        log.info(LogMessage.ASSETS_INIT_FINISHED, runId);

        // ==== OBSERVATION ====

        log.info(LogMessage.OBSERVATIONS_INIT_START);

        safeParse(runId, FileNameConstant.ENV_AVG_HUMIDITY,
                is -> observationInitService.parseMonthlyCityWideMetric(is, DataConstant.METRIC_AVG_HUMIDITY, DataConstant.CATEGORY_WEATHER));

        safeParse(runId, FileNameConstant.ENV_RAINFALL,
                is -> observationInitService.parseMonthlyCityWideMetric(is, DataConstant.METRIC_RAINFALL, DataConstant.CATEGORY_WEATHER));

        safeParse(runId, FileNameConstant.ENV_STATS,
                observationInitService::parseEnvironmentalStats);

        safeParse(runId, FileNameConstant.ENV_RIVER_LEVELS,
                observationInitService::parseRiverWaterLevels);

        safeParse(runId, FileNameConstant.ENV_AVG_TEMP,
                is -> observationInitService.parseMonthlyCityWideMetric(is, DataConstant.METRIC_AVG_TEMP, DataConstant.CATEGORY_WEATHER));

        safeParse(runId, FileNameConstant.ENV_SUNSHINE_HOURS,
                is -> observationInitService.parseMonthlyCityWideMetric(is, DataConstant.METRIC_SUNSHINE_HOURS, DataConstant.CATEGORY_WEATHER));

        safeParse(runId, FileNameConstant.DISASTER_DAMAGE,
                observationInitService::parseDisasterDamage);

        safeParse(runId, FileNameConstant.AGRI_PERENNIAL_AREA,
                observationInitService::parsePerennialCropsArea);

        safeParse(runId, FileNameConstant.AGRI_PERENNIAL_YIELD,
                observationInitService::parsePerennialCropsYield);

        safeParse(runId, FileNameConstant.ENV_YEAR_OVER_YEAR_WATER_LEVEL,
                observationInitService::parseYearOverYearWaterLevel);

        safeParse(runId, FileNameConstant.AGRI_ANNUAL_PROD_2022,
                is -> observationInitService.parseAnnualProductionFile(
                        is, DataConstant.HEADERS_H2022, DataConstant.COL_TEN, DataConstant.COL_PHAN_LOAI, DataConstant.COL_DON_VI_TINH,
                        DataConstant.COL_THUC_HIEN_2021, DataConstant.COL_UOC_TINH_2022));

        safeParse(runId, FileNameConstant.AGRI_ANNUAL_PROD_2023,
                is -> observationInitService.parseAnnualProductionFile(
                        is, DataConstant.HEADERS_H2023, DataConstant.COL_TEN, DataConstant.COL_PHAN_LOAI, DataConstant.COL_DON_VI_TINH,
                        DataConstant.COL_THUC_HIEN_2022, DataConstant.COL_UOC_TINH_2023));

        safeParse(runId, FileNameConstant.AGRI_ANNUAL_PROD_2024,
                is -> observationInitService.parseAnnualProductionFile(
                        is, DataConstant.HEADERS_H2024, DataConstant.COL_PHAN_LOAI, DataConstant.COL_TEN, DataConstant.COL_DON_VI_TINH,
                        DataConstant.COL_THUC_HIEN_2023, DataConstant.COL_UOC_TINH_2024));

        safeParse(runId, FileNameConstant.AGRI_PERENNIAL_PROD_2022,
                is -> observationInitService.parseAnnualProductionFile(
                        is, DataConstant.HEADERS_L2022, DataConstant.COL_TEN, DataConstant.COL_PHAN_LOAI, DataConstant.COL_DON_VI_TINH,
                        DataConstant.COL_THUC_HIEN_2021, DataConstant.COL_UOC_TINH_2022));

        safeParse(runId, FileNameConstant.AGRI_PERENNIAL_PROD_2023,
                is -> observationInitService.parseAnnualProductionFile(
                        is, DataConstant.HEADERS_L2023, DataConstant.COL_TEN, DataConstant.COL_PHAN_LOAI, DataConstant.COL_DON_VI_TINH,
                        DataConstant.COL_THUC_HIEN_2022, DataConstant.COL_UOC_TINH_2023));

        safeParse(runId, FileNameConstant.AGRI_PERENNIAL_PROD_2024,
                is -> observationInitService.parseAnnualProductionFile(
                        is, DataConstant.HEADERS_L2024, DataConstant.COL_PHAN_LOAI, DataConstant.COL_TEN, DataConstant.COL_DON_VI_TINH,
                        DataConstant.COL_THUC_HIEN_2023, DataConstant.COL_UOC_TINH_2024));

        log.info(LogMessage.OBSERVATIONS_INIT_FINISHED, runId);
    }

    @FunctionalInterface
    interface DataParser {
        ParseResult process(InputStream is) throws Exception;
    }

    private void safeParse(UUID runId, String filePath, DataParser parser) {
        DataIngestionLog logEntry = new DataIngestionLog();
        logEntry.setRunId(runId);
        logEntry.setFileName(filePath);
        logEntry.setStartTime(LocalDateTime.now());

        ParseResult result = ParseResult.zero();

        try (InputStream is = getClass().getClassLoader().getResourceAsStream(filePath)) {
            if (is == null) {
                throw new java.io.FileNotFoundException(LogMessage.ERR_FILE_NOT_FOUND_IN_RESOURCES + filePath);
            }
            result = parser.process(is);

            logEntry.setStatus(LogMessage.STATUS_SUCCESS);
        } catch (Exception e) {
            log.error(LogMessage.ERR_FILE_PARSE_FAILED, filePath, e.getMessage());
            logEntry.setStatus(LogMessage.STATUS_FAILED);
            logEntry.setErrorMessage(e.toString());
        } finally {
            logEntry.setRecordsProcessed(result.getRecordsProcessed());
            logEntry.setRecordsInserted(result.getRecordsInserted());
            logEntry.setEndTime(LocalDateTime.now());
            logRepository.save(logEntry);
        }
    }
}