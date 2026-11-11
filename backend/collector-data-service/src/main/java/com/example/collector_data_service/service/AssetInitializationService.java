package com.example.collector_data_service.service;

import com.example.collector_data_service.constant.LogMessage;
import com.example.collector_data_service.domain.entity.Asset;
import com.example.collector_data_service.helper.InitDataHelper;
import com.example.collector_data_service.helper.ParseResult;
import com.example.collector_data_service.repository.AssetRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AssetInitializationService {
    private final AssetRepository assetRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final InitDataHelper initDataHelper;

    private static final Logger log = LoggerFactory.getLogger(AssetInitializationService.class);

    private static final Pattern DISTRICT_PATTERN = Pattern.compile("(huyện|quận)\\s+([^,]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern WARD_PATTERN = Pattern.compile("(xã|phường)\\s+([^,]+)", Pattern.CASE_INSENSITIVE);


    // Danh muc cac ho ao
    @Transactional
    public ParseResult parseAndSavePondsAndLakes(InputStream is) throws IOException {
        final String ASSET_TYPE = "Hồ Ao";
        final String PARSE_CONTEXT = "Ponds and Lakes";
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Asset> assetsToSave = new ArrayList<>();

        Set<String> existingDbNames = assetRepository.findAllNamesInDb();
        Set<String> newNamesInThisBatch = new HashSet<>();

        CSVFormat customFormat = CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setHeader("Quận", "Tên hồ, ao, đầm, phá", "Vị trí, địa điểm (xã/phường)", "Diện tích (m2)", "Chức năng", "Đơn vị quản lý")
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String rawName = record.get("Tên hồ, ao, đầm, phá");
                    if (rawName.isEmpty() || rawName.contains("Các ao, hồ, đầm, phá có nguồn gốc tự nhiên")) {
                        continue;
                    }

                    String location = record.get("Vị trí, địa điểm (xã/phường)");
                    String uniqueName = rawName;
                    if (location != null && !location.trim().isEmpty()) {
                        uniqueName = rawName + " (" + location + ")";
                    }

                    if (existingDbNames.contains(uniqueName) || newNamesInThisBatch.contains(uniqueName)) {
                        continue;
                    }

                    Asset asset = new Asset();
                    asset.setName(uniqueName);
                    asset.setAssetType(ASSET_TYPE);
                    asset.setDistrict(record.get("Quận"));
                    asset.setAddress(location);

                    Map<String, Object> attributes = new HashMap<>();

                    attributes.put("area_m2", initDataHelper.parseSafeDouble(record.get("Diện tích (m2)")));
                    attributes.put("function", record.get("Chức năng"));
                    attributes.put("management_unit", record.get("Đơn vị quản lý"));

                    asset.setAttributes(objectMapper.writeValueAsString(attributes));

                    assetsToSave.add(asset);
                    newNamesInThisBatch.add(uniqueName);
                    recordsInserted++;

                } catch (Exception e) {
                    log.error(LogMessage.ERR_PROCESS_ASSET_RECORD_FAILED, record.getRecordNumber(), PARSE_CONTEXT, e.getMessage());
                }
            }
        }

        if (!assetsToSave.isEmpty()) {
            assetRepository.saveAll(assetsToSave);
        }

        log.info(LogMessage.SUCCESSFULLY_PARSED, PARSE_CONTEXT, recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Danh muc cac ho thuy loi
    @Transactional
    public ParseResult parseAndSaveIrrigationLakes(InputStream is) throws IOException {
        final String ASSET_TYPE = "Hồ Thủy Lợi";
        final String PARSE_CONTEXT = "Irrigation Lakes";
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Asset> assetsToSave = new ArrayList<>();

        Set<String> existingDbNames = assetRepository.findAllNamesInDb();
        Set<String> newNamesInThisBatch = new HashSet<>();

        String[] HEADERS = {
                "Tên hồ chứa", "Nguồn nước khai thác", "Thuộc hệ thống sông", "Diện tích mặt nước 103 (m2)",
                "Dung tích toàn bộ (triệu m3)", "Dung tích hữu ích (triệu m3)", "Vị trí hành chính",
                "Mục đích sử dụng", "Ghi chú"
        };
        CSVFormat customFormat = CSVFormat.DEFAULT.builder().setDelimiter(';').setHeader(HEADERS).setSkipHeaderRecord(true).setTrim(true).build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String rawName = record.get("Tên hồ chứa");
                    if (rawName == null || rawName.isEmpty()) {
                        continue;
                    }

                    if (existingDbNames.contains(rawName) || newNamesInThisBatch.contains(rawName)) {
                        continue;
                    }

                    Asset asset = new Asset();
                    asset.setName(rawName);
                    asset.setAssetType(ASSET_TYPE);

                    String locationStr = record.get("Vị trí hành chính");
                    asset.setAddress(locationStr);
                    asset.setDistrict(extractDistrict(locationStr));
                    asset.setWard(extractWard(locationStr));

                    Map<String, Object> attributes = new HashMap<>();
                    attributes.put("source_water", record.get("Nguồn nước khai thác"));
                    attributes.put("river_system", record.get("Thuộc hệ thống sông"));
                    attributes.put("purpose", record.get("Mục đích sử dụng"));
                    attributes.put("note", record.get("Ghi chú"));
                    attributes.put("surface_area_103_m2", initDataHelper.parseSafeDouble(record.get("Diện tích mặt nước 103 (m2)")));
                    attributes.put("capacity_total_mil_m3", initDataHelper.parseSafeDouble(record.get("Dung tích toàn bộ (triệu m3)")));
                    attributes.put("capacity_useful_mil_m3", initDataHelper.parseSafeDouble(record.get("Dung tích hữu ích (triệu m3)")));

                    asset.setAttributes(objectMapper.writeValueAsString(attributes));

                    assetsToSave.add(asset);
                    newNamesInThisBatch.add(rawName);
                    recordsInserted++;

                } catch (Exception e) {
                    log.error(LogMessage.ERR_PROCESS_ASSET_RECORD_FAILED, record.getRecordNumber(), PARSE_CONTEXT, e.getMessage());
                }
            }
        }

        if (!assetsToSave.isEmpty()) {
            assetRepository.saveAll(assetsToSave);
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, PARSE_CONTEXT, recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Danh muc song noi tinh
    @Transactional
    public ParseResult parseAndSaveRivers(InputStream is) throws IOException {
        final String ASSET_TYPE = "Sông";
        final String PARSE_CONTEXT = "Rivers and Streams";
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Asset> assetsToSave = new ArrayList<>();

        Set<String> existingDbNames = assetRepository.findAllNamesInDb();
        Set<String> newNamesInThisBatch = new HashSet<>();

        String[] HEADERS = {"Phân loại", "Mã sông", "Tên sông, suối", "Địa danh", "Chảy ra", "Chiều dài (Km)", "Diện tích lưu vực (Km2)", "Ghi chú"};
        CSVFormat customFormat = CSVFormat.DEFAULT.builder().setDelimiter(';').setHeader(HEADERS).setSkipHeaderRecord(true).setTrim(true).build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String rawName = record.get("Tên sông, suối");
                    String lengthStr = record.get("Chiều dài (Km)");

                    if (rawName == null || rawName.isEmpty() || lengthStr == null || lengthStr.isEmpty()) {
                        continue;
                    }

                    if (existingDbNames.contains(rawName) || newNamesInThisBatch.contains(rawName)) {
                        continue;
                    }

                    Asset asset = new Asset();
                    asset.setName(rawName);
                    asset.setAssetType(rawName.toLowerCase().contains("suối") ? "Suối" : ASSET_TYPE);

                    String locationStr = record.get("Địa danh");
                    asset.setAddress(locationStr);
                    asset.setDistrict(extractDistrict(locationStr));
                    asset.setWard(extractWard(locationStr));

                    Map<String, Object> attributes = new HashMap<>();
                    attributes.put("classification", record.get("Phân loại"));
                    attributes.put("river_code", record.get("Mã sông"));
                    attributes.put("flows_into", record.get("Chảy ra"));
                    attributes.put("note", record.get("Ghi chú"));
                    attributes.put("length_km", initDataHelper.parseSafeDouble(lengthStr));
                    attributes.put("basin_area_km2", initDataHelper.parseSafeDouble(record.get("Diện tích lưu vực (Km2)")));

                    asset.setAttributes(objectMapper.writeValueAsString(attributes));

                    assetsToSave.add(asset);
                    newNamesInThisBatch.add(rawName);
                    recordsInserted++;

                } catch (Exception e) {
                    log.error(LogMessage.ERR_PROCESS_ASSET_RECORD_FAILED, record.getRecordNumber(), PARSE_CONTEXT, e.getMessage());
                }
            }
        }

        if (!assetsToSave.isEmpty()) {
            assetRepository.saveAll(assetsToSave);
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, PARSE_CONTEXT, recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Danh sach khi vuc sat lo
    @Transactional
    public ParseResult parseAndSaveLandslideAreas(InputStream is) throws IOException {
        final String ASSET_TYPE = "Khu Vực Sạt Lở";
        final String PARSE_CONTEXT = "Landslide Areas";
        int recordsProcessed = 0;
        int recordsInserted = 0;

        String[] HEADERS = {"Phân loại", "Quận", "Phường", "Khu vực", "Vị trí cụ thể", "Điểm đầu", "Điểm cuối"};
        CSVFormat customFormat = CSVFormat.DEFAULT.builder().setDelimiter(';').setHeader(HEADERS).setSkipHeaderRecord(true).setTrim(true).build();

        Map<String, Integer> locationCounter = new HashMap<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String district = record.get("Quận");
                    String ward = record.get("Phường");
                    String coordinates = record.get("Điểm đầu");

                    if (district.isEmpty() && ward.isEmpty() && coordinates.isEmpty()) {
                        continue;
                    }

                    String locationKey = district + " - " + ward;
                    int count = locationCounter.getOrDefault(locationKey, 0) + 1;
                    locationCounter.put(locationKey, count);
                    String uniqueName = ASSET_TYPE + " - " + locationKey + " #" + count;

                    if (assetRepository.existsByName(uniqueName)) {
                        continue;
                    }

                    Asset asset = new Asset();
                    asset.setName(uniqueName);
                    asset.setAssetType(ASSET_TYPE);
                    asset.setDistrict(district);
                    asset.setWard(ward);
                    asset.setAddress(record.get("Vị trí cụ thể"));

                    if (coordinates != null && !coordinates.isEmpty()) {
                        String[] latLong = coordinates.split(",");
                        if (latLong.length == 2) {
                            asset.setLatitude(initDataHelper.parseSafeDouble(latLong[0].trim()));
                            asset.setLongitude(initDataHelper.parseSafeDouble(latLong[1].trim()));
                        } else {
                            log.warn(LogMessage.ERR_PARSE_COORDINATE_FOR_ASSET, coordinates, uniqueName);
                        }
                    }

                    Map<String, Object> attributes = new HashMap<>();
                    attributes.put("area_description", record.get("Khu vực"));
                    asset.setAttributes(objectMapper.writeValueAsString(attributes));

                    assetRepository.save(asset);
                    recordsInserted++;

                } catch (Exception e) {
                    log.error(LogMessage.ERR_PROCESS_ASSET_RECORD_FAILED, record.getRecordNumber(), PARSE_CONTEXT, e.getMessage());
                }
            }
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, PARSE_CONTEXT, recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Mot so thap canh bao ngap
    @Transactional
    public ParseResult parseAndSaveFloodWarningTowers(InputStream is) throws IOException {
        final String ASSET_TYPE = "Tháp Cảnh Báo Ngập";
        final String PARSE_CONTEXT = "Flood Warning Towers";
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Asset> assetsToSave = new ArrayList<>();

        Set<String> existingDbNames = assetRepository.findAllNamesInDb();
        Set<String> newNamesInThisBatch = new HashSet<>();

        String[] HEADERS = {"Tên", "Quận huyện", "Phường xã", "Vĩ độ", "Kinh độ", "Hình ảnh"};
        CSVFormat customFormat = CSVFormat.DEFAULT.builder().setDelimiter(';').setHeader(HEADERS).setSkipHeaderRecord(true).setTrim(true).build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String rawName = record.get("Tên");
                    if (rawName == null || rawName.isEmpty()) continue;

                    String uniqueName = ASSET_TYPE + " - " + rawName;

                    if (existingDbNames.contains(uniqueName) || newNamesInThisBatch.contains(uniqueName)) {
                        continue;
                    }

                    Asset asset = new Asset();
                    asset.setName(uniqueName);
                    asset.setAssetType(ASSET_TYPE);
                    asset.setDistrict(record.get("Quận huyện"));
                    asset.setWard(record.get("Phường xã"));
                    asset.setAddress(rawName);
                    asset.setLatitude(initDataHelper.parseSafeDouble(record.get("Vĩ độ")));
                    asset.setLongitude(initDataHelper.parseSafeDouble(record.get("Kinh độ")));

                    Map<String, Object> attributes = new HashMap<>();
                    attributes.put("image_url", record.get("Hình ảnh"));
                    asset.setAttributes(objectMapper.writeValueAsString(attributes));

                    assetsToSave.add(asset);
                    newNamesInThisBatch.add(uniqueName);
                    recordsInserted++;

                } catch (Exception e) {
                    log.error(LogMessage.ERR_PROCESS_ASSET_RECORD_FAILED, record.getRecordNumber(), PARSE_CONTEXT, e.getMessage());
                }
            }
        }

        if (!assetsToSave.isEmpty()) {
            assetRepository.saveAll(assetsToSave);
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, PARSE_CONTEXT, recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Mot so tram canh bao lu tu dong
    @Transactional
    public ParseResult parseAndSaveAutoFloodWarningStations(InputStream is) throws IOException {
        final String ASSET_TYPE = "Trạm Cảnh Báo Lũ";
        final String PARSE_CONTEXT = "Auto Flood Warning Stations";
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Asset> assetsToSave = new ArrayList<>();

        Set<String> existingDbNames = assetRepository.findAllNamesInDb();
        Set<String> newNamesInThisBatch = new HashSet<>();

        String[] HEADERS = {"Tên", "Địa chỉ", "Quận huyện", "Phường xã", "Vĩ độ", "Kinh độ", "Hình ảnh"};
        CSVFormat customFormat = CSVFormat.DEFAULT.builder().setDelimiter(';').setHeader(HEADERS).setSkipHeaderRecord(true).setTrim(true).build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String rawName = record.get("Tên");
                    if (rawName == null || rawName.isEmpty()) continue;

                    String uniqueName = ASSET_TYPE + " - " + rawName;

                    if (existingDbNames.contains(uniqueName) || newNamesInThisBatch.contains(uniqueName)) {
                        continue;
                    }

                    Asset asset = new Asset();
                    asset.setName(uniqueName);
                    asset.setAssetType(ASSET_TYPE);
                    asset.setDistrict(record.get("Quận huyện"));
                    asset.setWard(record.get("Phường xã"));
                    asset.setAddress(record.get("Địa chỉ"));
                    asset.setLatitude(initDataHelper.parseSafeDouble(record.get("Vĩ độ")));
                    asset.setLongitude(initDataHelper.parseSafeDouble(record.get("Kinh độ")));

                    Map<String, Object> attributes = new HashMap<>();
                    attributes.put("image_url", record.get("Hình ảnh"));
                    asset.setAttributes(objectMapper.writeValueAsString(attributes));

                    assetsToSave.add(asset);
                    newNamesInThisBatch.add(uniqueName);
                    recordsInserted++;

                } catch (Exception e) {
                    log.error(LogMessage.ERR_PROCESS_ASSET_RECORD_FAILED, record.getRecordNumber(), PARSE_CONTEXT, e.getMessage());
                }
            }
        }

        if (!assetsToSave.isEmpty()) {
            assetRepository.saveAll(assetsToSave);
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, PARSE_CONTEXT, recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Mot so tram do mua tu dong
    @Transactional
    public ParseResult parseAndSaveRainStations(InputStream is) throws IOException {
        final String ASSET_TYPE = "Trạm Đo Mưa";
        final String PARSE_CONTEXT = "Rain Stations";
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Asset> assetsToSave = new ArrayList<>();

        Set<String> existingDbNames = assetRepository.findAllNamesInDb();
        Set<String> newNamesInThisBatch = new HashSet<>();

        String[] HEADERS = {"Tên", "Địa chỉ", "Quận huyện", "Phường xã", "Vĩ độ", "Kinh độ", "Hình ảnh"};
        CSVFormat customFormat = CSVFormat.DEFAULT.builder().setDelimiter(';').setHeader(HEADERS).setSkipHeaderRecord(true).setTrim(true).build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String rawName = record.get("Tên");
                    if (rawName == null || rawName.isEmpty()) continue;

                    String uniqueName = ASSET_TYPE + " - " + rawName;

                    if (existingDbNames.contains(uniqueName) || newNamesInThisBatch.contains(uniqueName)) {
                        continue;
                    }

                    Asset asset = new Asset();
                    asset.setName(uniqueName);
                    asset.setAssetType(ASSET_TYPE);
                    asset.setDistrict(record.get("Quận huyện"));
                    asset.setWard(record.get("Phường xã"));
                    asset.setAddress(record.get("Địa chỉ"));
                    asset.setLatitude(initDataHelper.parseSafeDouble(record.get("Vĩ độ")));
                    asset.setLongitude(initDataHelper.parseSafeDouble(record.get("Kinh độ")));

                    Map<String, Object> attributes = new HashMap<>();
                    attributes.put("image_url", record.get("Hình ảnh"));
                    asset.setAttributes(objectMapper.writeValueAsString(attributes));

                    assetsToSave.add(asset);
                    newNamesInThisBatch.add(uniqueName);
                    recordsInserted++;

                } catch (Exception e) {
                    log.error(LogMessage.ERR_PROCESS_ASSET_RECORD_FAILED, record.getRecordNumber(), PARSE_CONTEXT, e.getMessage());
                }
            }
        }

        if (!assetsToSave.isEmpty()) {
            assetRepository.saveAll(assetsToSave);
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, PARSE_CONTEXT, recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Thong tin cac nha tru bao
    @Transactional
    public ParseResult parseAndSaveStormShelters(InputStream is) throws IOException {
        final String ASSET_TYPE = "Nhà Trú Bão";
        final String PARSE_CONTEXT = "Storm Shelters";
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Asset> assetsToSave = new ArrayList<>();

        Set<String> existingDbNames = assetRepository.findAllNamesInDb();
        Set<String> newNamesInThisBatch = new HashSet<>();

        String[] HEADERS = {"Tên", "Địa chỉ", "Quận huyện", "Phường xã", "Vĩ độ", "Kinh độ", "Chiều cao", "Kết cấu", "Cấp công trình", "Chất lượng", "Sức chứa", "Hình ảnh"};
        CSVFormat customFormat = CSVFormat.DEFAULT.builder().setDelimiter(';').setHeader(HEADERS).setSkipHeaderRecord(true).setTrim(true).build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String rawName = record.get("Tên");
                    if (rawName.isEmpty()) continue;

                    if (existingDbNames.contains(rawName) || newNamesInThisBatch.contains(rawName)) {
                        continue;
                    }

                    Asset asset = new Asset();
                    asset.setName(rawName);
                    asset.setAssetType(ASSET_TYPE);
                    asset.setDistrict(record.get("Quận huyện"));
                    asset.setWard(record.get("Phường xã"));
                    asset.setAddress(record.get("Địa chỉ"));
                    asset.setLatitude(initDataHelper.parseSafeDouble(record.get("Vĩ độ")));
                    asset.setLongitude(initDataHelper.parseSafeDouble(record.get("Kinh độ")));

                    Map<String, Object> attributes = new HashMap<>();
                    attributes.put("height", record.get("Chiều cao"));
                    attributes.put("structure", record.get("Kết cấu"));
                    attributes.put("level", record.get("Cấp công trình"));
                    attributes.put("quality", record.get("Chất lượng"));
                    attributes.put("capacity", record.get("Sức chứa"));
                    attributes.put("image_url", record.get("Hình ảnh"));
                    asset.setAttributes(objectMapper.writeValueAsString(attributes));

                    assetsToSave.add(asset);
                    newNamesInThisBatch.add(rawName);
                    recordsInserted++;

                } catch (Exception e) {
                    log.error(LogMessage.ERR_PROCESS_ASSET_RECORD_FAILED, record.getRecordNumber(), PARSE_CONTEXT, e.getMessage());
                }
            }
        }

        if (!assetsToSave.isEmpty()) {
            assetRepository.saveAll(assetsToSave);
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, PARSE_CONTEXT, recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    // Tram canh bao ven bien
    @Transactional
    public ParseResult parseAndSaveCoastalWarningStations(InputStream is) throws IOException {
        final String ASSET_TYPE = "Trạm Cảnh Báo Ven Biển";
        final String PARSE_CONTEXT = "Coastal Warning Stations";
        int recordsProcessed = 0;
        int recordsInserted = 0;
        List<Asset> assetsToSave = new ArrayList<>();

        Set<String> existingDbNames = assetRepository.findAllNamesInDb();
        Set<String> newNamesInThisBatch = new HashSet<>();

        String[] HEADERS = {"Tên", "Quận huyện", "Phường xã", "Vĩ độ", "Kinh độ", "Hình ảnh"};
        CSVFormat customFormat = CSVFormat.DEFAULT.builder().setDelimiter(';').setHeader(HEADERS).setSkipHeaderRecord(true).setTrim(true).build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, customFormat)) {

            for (CSVRecord record : csvParser) {
                recordsProcessed++;
                try {
                    String rawName = record.get("Tên");
                    if (rawName == null || rawName.isEmpty()) continue;

                    String uniqueName = ASSET_TYPE + " - " + rawName;

                    if (existingDbNames.contains(uniqueName) || newNamesInThisBatch.contains(uniqueName)) {
                        continue;
                    }

                    Asset asset = new Asset();
                    asset.setName(uniqueName);
                    asset.setAssetType(ASSET_TYPE);
                    asset.setDistrict(record.get("Quận huyện"));
                    asset.setWard(record.get("Phường xã"));
                    asset.setAddress(rawName);
                    asset.setLatitude(initDataHelper.parseSafeDouble(record.get("Vĩ độ")));
                    asset.setLongitude(initDataHelper.parseSafeDouble(record.get("Kinh độ")));

                    Map<String, Object> attributes = new HashMap<>();
                    attributes.put("image_url", record.get("Hình ảnh"));
                    asset.setAttributes(objectMapper.writeValueAsString(attributes));

                    assetsToSave.add(asset);
                    newNamesInThisBatch.add(uniqueName);
                    recordsInserted++;

                } catch (Exception e) {
                    log.error(LogMessage.ERR_PROCESS_ASSET_RECORD_FAILED, record.getRecordNumber(), PARSE_CONTEXT, e.getMessage());
                }
            }
        }

        if (!assetsToSave.isEmpty()) {
            assetRepository.saveAll(assetsToSave);
        }
        log.info(LogMessage.SUCCESSFULLY_PARSED, PARSE_CONTEXT, recordsProcessed, recordsInserted);
        return new ParseResult(recordsProcessed, recordsInserted);
    }

    private String extractDistrict(String address) {
        if (address == null) return null;
        Matcher matcher = DISTRICT_PATTERN.matcher(address);
        if (matcher.find()) {
            return matcher.group(2).trim();
        }
        return null;
    }

    private String extractWard(String address) {
        if (address == null) return null;
        Matcher matcher = WARD_PATTERN.matcher(address);
        if (matcher.find()) {
            return matcher.group(2).trim();
        }
        return null;
    }
}