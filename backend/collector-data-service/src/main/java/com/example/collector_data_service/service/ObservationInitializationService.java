package com.example.collector_data_service.service;

import com.example.collector_data_service.constant.ErrorMessage;
import com.example.collector_data_service.constant.LogMessage;
import com.example.collector_data_service.domain.entity.Asset;
import com.example.collector_data_service.domain.entity.Metric;
import com.example.collector_data_service.domain.entity.Observation;
import com.example.collector_data_service.exception.VsException;
import com.example.collector_data_service.helper.InitDataHelper;
import com.example.collector_data_service.helper.ParseResult;
import com.example.collector_data_service.repository.AssetRepository;
import com.example.collector_data_service.repository.MetricRepository;
import com.example.collector_data_service.repository.ObservationRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ObservationInitializationService {

    private static final Logger log = LoggerFactory.getLogger(ObservationInitializationService.class);

    private final AssetRepository assetRepository;
    private final MetricRepository metricRepository;
    private final ObservationRepository observationRepository;

    private final InitDataHelper initDataHelper;

    private final String defaultCityName = "Thành phố Đà Nẵng";
    private static final Pattern YEAR_PATTERN = Pattern.compile("(\\d{4})");

    private Asset getOrCreateDefaultCityAsset() {
        String defaultAssetName = defaultCityName;
        return assetRepository.findByName(defaultAssetName).orElseGet(() -> {
            Asset asset = new Asset();
            asset.setName(defaultAssetName);
            asset.setAssetType("Hành chính");
            return assetRepository.save(asset);
        });
    }

    private Metric findOrCreateMetric(String name, String category, String unit, Map<String, Metric> cache) {
        Metric cachedMetric = cache.get(name);
        if (cachedMetric != null) {
            return cachedMetric;
        }

        Metric metric = metricRepository.findByName(name).orElseGet(() -> {
            log.info(LogMessage.CREATE_NEW_METRIC, name, category);
            Metric newMetric = new Metric();
            newMetric.setName(name);
            newMetric.setCategory(category);
            newMetric.setUnit(unit);
            return metricRepository.save(newMetric);
        });

        cache.put(name, metric);
        return metric;
    }

    @Transactional
    public ParseResult parseMonthlyCityWideMetric(InputStream is, String metricName, String metricCategory) throws IOException {
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Observation> observationsToSave = new ArrayList<>();
        Map<String, Metric> metricCache = new HashMap<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = CSVFormat.DEFAULT.withDelimiter(';').withFirstRecordAsHeader().withTrim().parse(reader)) {

            Pattern pattern = Pattern.compile("(\\d{4}).*?\\((.*?)\\)");
            Asset defaultAsset = getOrCreateDefaultCityAsset();
            String unit = "";

            List<String> headers = csvParser.getHeaderNames();
            for (String header : headers) {
                Matcher matcher = pattern.matcher(header);
                if (matcher.find()) {
                    unit = matcher.group(2).trim();
                    break;
                }
            }

            Metric metric = findOrCreateMetric(metricName, metricCategory, unit, metricCache);

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String firstColumn = record.get(0);
                    String monthStr = firstColumn.replaceAll("[^0-9]", "");
                    if (monthStr.isEmpty()) continue;
                    int month = Integer.parseInt(monthStr);

                    for (String header : headers) {
                        Matcher matcher = pattern.matcher(header);
                        if (matcher.find()) {
                            int year = Integer.parseInt(matcher.group(1));
                            String valueStr = record.get(header).trim();

                            Double value = initDataHelper.parseSafeDouble(valueStr);
                            if (value == null) {
                                continue;
                            }

                            Observation obs = new Observation();
                            obs.setAsset(defaultAsset);
                            obs.setMetric(metric);
                            obs.setRecordTime(LocalDateTime.of(year, month, 1, 0, 0));
                            obs.setValue(value);
                            observationsToSave.add(obs);
                            recordsInserted++;
                        }
                    }
                } catch (Exception e) {
                    log.error(LogMessage.ERR_FILE_PARSE_FAILED, record.getRecordNumber(), e.getMessage());
                }
            }
            if (!observationsToSave.isEmpty()) {
                observationRepository.saveAll(observationsToSave);
            }
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, metricName, recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Muc nuoc mot so song chinh
    @Transactional
    public ParseResult parseRiverWaterLevels(InputStream is) throws IOException {
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Observation> observationsToSave = new ArrayList<>();
        Map<String, Metric> metricCache = new HashMap<>();
        Asset defaultAsset = getOrCreateDefaultCityAsset();

        String[] HEADERS = {"Phân loại", "Đơn vị tính", "Năm 2019", "Năm 2020", "Năm 2021", "Năm 2022", "Sơ bộ 2023"};
        CSVFormat customFormat = CSVFormat.DEFAULT.builder()
                .setDelimiter(';').setHeader(HEADERS).setSkipHeaderRecord(true).setTrim(true).build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String metricName = record.get("Phân loại");
                    String unit = record.get("Đơn vị tính");
                    Asset targetAsset = null;

                    if (metricName.toLowerCase().contains("sông")) {
                        String[] parts = metricName.split("sông");
                        if (parts.length > 1) {
                            String riverName = "Sông" + parts[1].trim();
                            Optional<Asset> assetOpt = assetRepository.findByName(riverName);
                            if (assetOpt.isPresent()) {
                                targetAsset = assetOpt.get();
                            } else {
                                log.warn(LogMessage.ERR_ASSET_NOT_FOUND_FOR_RIVER, riverName);
                                continue;
                            }
                        }
                    } else {
                        targetAsset = defaultAsset;
                    }

                    if (targetAsset == null) continue;

                    Metric metric = findOrCreateMetric(metricName, "Thủy văn", unit, metricCache);

                    for (String header : HEADERS) {
                        Matcher matcher = YEAR_PATTERN.matcher(header);
                        if (matcher.find()) {
                            int year = Integer.parseInt(matcher.group(1));
                            String valueStr = record.get(header).trim();

                            Double value = initDataHelper.parseSafeDouble(valueStr);
                            if (value == null) {
                                continue;
                            }

                            Observation obs = new Observation();
                            obs.setAsset(targetAsset);
                            obs.setMetric(metric);
                            obs.setRecordTime(LocalDateTime.of(year, 1, 1, 0, 0));
                            obs.setValue(value);
                            observationsToSave.add(obs);
                            recordsInserted++;
                        }
                    }
                } catch (Exception e) {
                    log.error(LogMessage.ERR_FILE_PARSE_FAILED, record.getRecordNumber(), e.getMessage());
                }
            }
            if (!observationsToSave.isEmpty()) {
                observationRepository.saveAll(observationsToSave);
            }
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, "River Water Levels", recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Mot so chi tieu thong ke moi truong
    @Transactional
    public ParseResult parseEnvironmentalStats(InputStream is) throws IOException {
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Observation> observationsToSave = new ArrayList<>();
        Map<String, Metric> metricCache = new HashMap<>();
        Asset defaultAsset = getOrCreateDefaultCityAsset();
        String unit = "%";

        String[] HEADERS = {"Phân loại", "Năm 2019 (ĐVT:%)", "Năm 2020 (ĐVT:%)", "Năm 2021 (ĐVT:%)", "Sơ bộ 2022 (ĐVT:%)"};
        CSVFormat customFormat = CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setHeader(HEADERS)
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String metricName = record.get("Phân loại");
                    if (metricName.isEmpty()) continue;

                    Metric metric = findOrCreateMetric(metricName, "Môi trường", unit, metricCache);

                    for (String header : HEADERS) {
                        Matcher matcher = YEAR_PATTERN.matcher(header);
                        if (matcher.find()) {
                            int year = Integer.parseInt(matcher.group(1));
                            String valueStr = record.get(header).trim();

                            Double value = initDataHelper.parseSafeDouble(valueStr);
                            if (value == null) {
                                continue;
                            }

                            Observation obs = new Observation();
                            obs.setAsset(defaultAsset);
                            obs.setMetric(metric);
                            obs.setRecordTime(LocalDateTime.of(year, 1, 1, 0, 0));
                            obs.setValue(value);
                            observationsToSave.add(obs);
                            recordsInserted++;
                        }
                    }
                } catch (Exception e) {
                    log.error(LogMessage.ERR_FILE_PARSE_FAILED, record.getRecordNumber(), e.getMessage());
                }
            }
            if (!observationsToSave.isEmpty()) {
                observationRepository.saveAll(observationsToSave);
            }
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, "Environmental Stats", recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Thiet hai do thien tai
    @Transactional
    public ParseResult parseDisasterDamage(InputStream is) throws IOException {
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Observation> observationsToSave = new ArrayList<>();

        Map<String, Metric> metricCache = new HashMap<>();
        Asset defaultAsset = getOrCreateDefaultCityAsset();

        String[] HEADERS = {"Phân theo", "Phân loại", "Đơn vị tính", "Năm 2018", "Năm 2020", "Năm 2021", "Sơ bộ 2022"};
        CSVFormat customFormat = CSVFormat.DEFAULT.builder()
                .setDelimiter(';').setHeader(HEADERS).setSkipHeaderRecord(true).setTrim(true).build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;

                try {
                    String category = record.get("Phân theo");
                    String name = record.get("Phân loại");
                    String unit = record.get("Đơn vị tính");

                    if (category.isEmpty() && name.isEmpty()) {
                        continue;
                    }

                    String metricName = name.equalsIgnoreCase(category) ? name : category + " - " + name;

                    Metric metric = findOrCreateMetric(metricName, "Thiệt hại thiên tai", unit, metricCache);

                    for (String header : HEADERS) {
                        Matcher matcher = YEAR_PATTERN.matcher(header);
                        if (matcher.find()) {
                            int year = Integer.parseInt(matcher.group(1));
                            String valueStr = record.get(header).trim();

                            Double value = initDataHelper.parseSafeDouble(valueStr);

                            if (value == null) {
                                continue;
                            }

                            Observation obs = new Observation();
                            obs.setAsset(defaultAsset);
                            obs.setMetric(metric);
                            obs.setRecordTime(LocalDateTime.of(year, 1, 1, 0, 0));
                            obs.setValue(value);
                            observationsToSave.add(obs);
                            recordsInserted++;
                        }
                    }
                } catch (Exception e) {
                    log.error(LogMessage.ERR_FILE_PARSE_FAILED, record.getRecordNumber(), e.getMessage());
                }
            }

            if (!observationsToSave.isEmpty()) {
                observationRepository.saveAll(observationsToSave);
            }
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, "Disaster Damage", recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Dien tich hien co cay lau nam
    @Transactional
    public ParseResult parsePerennialCropsArea(InputStream is) throws IOException {
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Observation> observationsToSave = new ArrayList<>();
        Map<String, Metric> metricCache = new HashMap<>();
        final String METRIC_CATEGORY = "Nông nghiệp";
        final String METRIC_PREFIX = "Diện tích hiện có - ";

        String[] HEADERS = {
                "Quận huyện",
                "2018 (ĐVT: Ha)",
                "2019 (ĐVT: Ha)",
                "2020 (ĐVT: Ha)",
                "2021 (ĐVT: Ha)",
                "Sơ bộ 2022 (ĐVT: Ha)"
        };

        CSVFormat customFormat = CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setHeader(HEADERS)
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            Pattern pattern = Pattern.compile("(\\d{4}).*?\\((.*?)\\)");
            Asset defaultAsset = getOrCreateDefaultCityAsset();

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String cropName = record.get(HEADERS[0]);
                    if (cropName == null || cropName.isEmpty()) continue;

                    String unit = "Ha";
                    Matcher unitMatcher = pattern.matcher(HEADERS[1]);
                    if (unitMatcher.find()) {
                        unit = unitMatcher.group(2).trim();
                    }

                    Metric metric = findOrCreateMetric(METRIC_PREFIX + cropName, METRIC_CATEGORY, unit, metricCache);

                    for (String header : HEADERS) {
                        if (header.equals(HEADERS[0])) continue;

                        Matcher yearMatcher = pattern.matcher(header);
                        if (yearMatcher.find()) {
                            int year = Integer.parseInt(yearMatcher.group(1));
                            String valueStr = record.get(header).trim();

                            Double value = initDataHelper.parseSafeDouble(valueStr);
                            if (value == null) {
                                continue;
                            }

                            Observation obs = new Observation();
                            obs.setAsset(defaultAsset);
                            obs.setMetric(metric);
                            obs.setRecordTime(LocalDateTime.of(year, 1, 1, 0, 0));
                            obs.setValue(value);
                            observationsToSave.add(obs);
                            recordsInserted++;
                        }
                    }
                } catch (Exception e) {
                    log.error(LogMessage.ERR_FILE_PARSE_FAILED, record.getRecordNumber(), e.getMessage());
                }
            }
            if (!observationsToSave.isEmpty()) {
                observationRepository.saveAll(observationsToSave);
            }
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, "Perennial Crops Area", recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // San pham va san luong cay lau nam
    @Transactional
    public ParseResult parsePerennialCropsYield(InputStream is) throws IOException {
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Observation> observationsToSave = new ArrayList<>();
        Map<String, Metric> metricCache = new HashMap<>();
        final String METRIC_CATEGORY = "Nông nghiệp";
        final String METRIC_PREFIX = "Sản lượng - ";

        String[] HEADERS = {
                "Quận huyện",
                "2018 (ĐVT: Tấn)",
                "2019 (ĐVT: Tấn)",
                "2020 (ĐVT: Tấn)",
                "2021 (ĐVT: Tấn)",
                "Sơ bộ 2022 (ĐVT: Tấn)"
        };

        CSVFormat customFormat = CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setHeader(HEADERS)
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            Pattern pattern = Pattern.compile("(\\d{4}).*?\\((.*?)\\)");
            Asset defaultAsset = getOrCreateDefaultCityAsset();

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String cropName = record.get(HEADERS[0]);
                    if (cropName == null || cropName.isEmpty()) continue;

                    String unit = "Tấn";
                    Matcher unitMatcher = pattern.matcher(HEADERS[1]);
                    if (unitMatcher.find()) {
                        unit = unitMatcher.group(2).trim();
                    }

                    Metric metric = findOrCreateMetric(METRIC_PREFIX + cropName, METRIC_CATEGORY, unit, metricCache);

                    for (String header : HEADERS) {
                        if (header.equals(HEADERS[0])) continue;

                        Matcher yearMatcher = pattern.matcher(header);
                        if (yearMatcher.find()) {
                            int year = Integer.parseInt(yearMatcher.group(1));
                            String valueStr = record.get(header).trim();

                            Double value = initDataHelper.parseSafeDouble(valueStr);
                            if (value == null) {
                                continue;
                            }

                            Observation obs = new Observation();
                            obs.setAsset(defaultAsset);
                            obs.setMetric(metric);
                            obs.setRecordTime(LocalDateTime.of(year, 1, 1, 0, 0));
                            obs.setValue(value);
                            observationsToSave.add(obs);
                            recordsInserted++;
                        }
                    }
                } catch (Exception e) {
                    log.error(LogMessage.ERR_FILE_PARSE_FAILED, record.getRecordNumber(), e.getMessage());
                }
            }
            if (!observationsToSave.isEmpty()) {
                observationRepository.saveAll(observationsToSave);
            }
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, "Perennial Crops Yield", recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Luong mua thay doi qua tung nam
    @Transactional
    public ParseResult parseYearOverYearWaterLevel(InputStream is) throws IOException {
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Observation> observationsToSave = new ArrayList<>();
        Map<String, Metric> metricCache = new HashMap<>();

        final String METRIC_CATEGORY = "Thủy văn";
        final String METRIC_UNIT = "mm";
        final String METRIC_PREFIX = "Mực nước thay đổi - ";

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = CSVFormat.DEFAULT.withDelimiter(';').withFirstRecordAsHeader().withTrim().parse(reader)) {

            Map<String, Metric> metricMap = new HashMap<>();
            Map<String, Integer> yearMap = new HashMap<>();

            for (String header : csvParser.getHeaderNames()) {
                if (header.isEmpty() || csvParser.getHeaderNames().indexOf(header) == 0) {
                    continue;
                }

                String metricName = METRIC_PREFIX + header;
                Metric metric = findOrCreateMetric(metricName, METRIC_CATEGORY, METRIC_UNIT, metricCache);
                metricMap.put(header, metric);

                Matcher matcher = YEAR_PATTERN.matcher(header);
                if (matcher.find()) {
                    yearMap.put(header, Integer.parseInt(matcher.group(1)));
                } else {
                    log.warn("Could not extract year from header: {}", header);
                }
            }

            for (CSVRecord record : csvParser) {
                recordsProcessed++;

                try {
                    Asset targetAsset = getOrCreateDefaultCityAsset();

                    for (String header : metricMap.keySet()) {
                        String valueStr = record.get(header);

                        Double value = initDataHelper.parseSafeDouble(valueStr);
                        if (value == null) {
                            continue;
                        }

                        Metric metric = metricMap.get(header);
                        Integer year = yearMap.get(header);

                        if (metric == null || year == null) {
                            log.warn("Skipping data for header '{}', metric or year not mapped.", header);
                            continue;
                        }

                        Observation obs = new Observation();
                        obs.setAsset(targetAsset);
                        obs.setMetric(metric);
                        obs.setRecordTime(LocalDateTime.of(year, 1, 1, 0, 0));
                        obs.setValue(value);
                        observationsToSave.add(obs);
                        recordsInserted++;
                    }
                } catch (Exception e) {
                    log.error(LogMessage.ERR_FILE_PARSE_FAILED, record.getRecordNumber(), e.getMessage());
                }
            }

            if (!observationsToSave.isEmpty()) {
                observationRepository.saveAll(observationsToSave);
            }
        }

        log.info(LogMessage.SUCCESSFULLY_PARSED, "Year-Over-Year Water Level", recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    @Transactional
    public ParseResult parseAnnualProductionFile(InputStream is,
                                                 String[] HEADERS,
                                                 String cropNameCol,
                                                 String metricNameCol,
                                                 String unitCol,
                                                 String year1Col,
                                                 String year2Col) throws IOException {
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Observation> observationsToSave = new ArrayList<>();
        Map<String, Metric> metricCache = new HashMap<>();
        final String METRIC_CATEGORY = "Nông nghiệp";

        int year1 = 0;
        int year2 = 0;

        Matcher m1 = YEAR_PATTERN.matcher(year1Col);
        if (m1.find()) year1 = Integer.parseInt(m1.group(1));

        Matcher m2 = YEAR_PATTERN.matcher(year2Col);
        if (m2.find()) year2 = Integer.parseInt(m2.group(1));

        if (year1 == 0 || year2 == 0) {
            throw new VsException(ErrorMessage.ERR_EXTRACT_YEAR_FROM_COL_FAIL + year1Col + ", " + year2Col);
        }

        CSVFormat customFormat = CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setHeader(HEADERS)
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            Asset defaultAsset = getOrCreateDefaultCityAsset();

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String cropName = record.get(cropNameCol);
                    String metricType = record.get(metricNameCol);
                    String unit = record.get(unitCol);

                    if (cropName.isEmpty() && metricType.isEmpty()) continue;

                    String metricName = cropName.equals(metricType) ? cropName : cropName + " - " + metricType;

                    Metric metric = findOrCreateMetric(metricName, METRIC_CATEGORY, unit, metricCache);

                    String valueStr1 = record.get(year1Col).trim();
                    Double value1 = initDataHelper.parseSafeDouble(valueStr1);
                    if (value1 != null) {
                        Observation obs1 = new Observation();
                        obs1.setAsset(defaultAsset);
                        obs1.setMetric(metric);
                        obs1.setRecordTime(LocalDateTime.of(year1, 1, 1, 0, 0));
                        obs1.setValue(value1);
                        observationsToSave.add(obs1);
                        recordsInserted++;
                    }

                    String valueStr2 = record.get(year2Col).trim();
                    Double value2 = initDataHelper.parseSafeDouble(valueStr2);
                    if (value2 != null) {
                        Observation obs2 = new Observation();
                        obs2.setAsset(defaultAsset);
                        obs2.setMetric(metric);
                        obs2.setRecordTime(LocalDateTime.of(year2, 1, 1, 0, 0));
                        obs2.setValue(value2);
                        observationsToSave.add(obs2);
                        recordsInserted++;
                    }
                } catch (Exception e) {
                    log.error(LogMessage.ERR_FILE_PARSE_FAILED, record.getRecordNumber(), e.getMessage());
                }
            }
            if (!observationsToSave.isEmpty()) {
                observationRepository.saveAll(observationsToSave);
            }
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, "Annual Production File", recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }
}