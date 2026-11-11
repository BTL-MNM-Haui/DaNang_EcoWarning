package com.example.collector_data_service.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/data-imports")
@RequiredArgsConstructor
public class DataImportController {
  private final JdbcTemplate db;
  private final TransactionTemplate tx;
  private final ObjectMapper json;

  @Value("${auth.service.url:http://auth-service:8084}")
  private String authUrl;

  @PostConstruct
  void schema() {
    db.execute(
        "CREATE TABLE IF NOT EXISTS data_import_batches(id uuid PRIMARY KEY,owner_email"
            + " varchar(320) NOT NULL,source varchar(300) NOT NULL,file_name varchar(255) NOT"
            + " NULL,digest varchar(64) NOT NULL,rows_json jsonb NOT NULL,status varchar(20) NOT"
            + " NULL DEFAULT 'PREVIEW',created_at timestamptz NOT NULL DEFAULT now(),committed_at"
            + " timestamptz,inserted_count int NOT NULL DEFAULT 0)");
  }

  private String admin(String token) {
    try {
      var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
      factory.setConnectTimeout(5000);
      factory.setReadTimeout(5000);
      var body =
          RestClient.builder()
              .requestFactory(factory)
              .build()
              .post()
              .uri(authUrl + "/api/v1/auth/token")
              .header("Authorization", token)
              .retrieve()
              .body(Map.class);
      if (body != null
          && body.get("data") instanceof Map<?, ?> user
          && Set.of("ROLE_ADMIN", "ROLE_MODERATOR").contains(user.get("role")))
        return user.get("email").toString();
    } catch (Exception e) {
      throw new ResponseStatusException(
          HttpStatus.UNAUTHORIZED, "Phiên quản lý chưa hợp lệ hoặc dịch vụ xác thực gián đoạn.");
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cần quyền quản lý dữ liệu.");
  }

  @GetMapping
  Object history(@RequestHeader("Authorization") String token) {
    admin(token);
    return db.queryForList(
        "SELECT id,source,file_name,status,created_at,committed_at,inserted_count FROM"
            + " data_import_batches ORDER BY created_at DESC LIMIT 100");
  }

  @PostMapping(value = "/preview", consumes = "multipart/form-data")
  Object preview(
      @RequestHeader("Authorization") String token,
      @RequestPart("file") MultipartFile file,
      @RequestParam String source,
      @RequestParam(defaultValue = "{}") String mapping)
      throws Exception {
    String owner = admin(token);
    if (file.isEmpty() || file.getSize() > 2_000_000) throw bad("CSV phải từ 1 byte đến 2 MB.");
    if (source.isBlank() || source.length() > 300) throw bad("Cần nguồn dữ liệu tối đa 300 ký tự.");
    Map<String, String> columns = json.readValue(mapping, new TypeReference<>() {});
    List<Map<String, Object>> rows = new ArrayList<>();
    Set<String> seen = new HashSet<>();
    try (var reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
        var parser =
            CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .build()
                .parse(reader)) {
      for (var record : parser) {
        if (rows.size() >= 2000) throw bad("Mỗi lần nhập tối đa 2.000 dòng.");
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("line", record.getRecordNumber() + 1);
        try {
          long asset = Long.parseLong(record.get(columns.getOrDefault("assetId", "assetId"))),
              metric = Long.parseLong(record.get(columns.getOrDefault("metricId", "metricId")));
          LocalDateTime time =
              LocalDateTime.parse(record.get(columns.getOrDefault("recordTime", "recordTime")));
          double value = Double.parseDouble(record.get(columns.getOrDefault("value", "value")));
          if (!Double.isFinite(value)) throw new Exception("Giá trị phải hữu hạn.");
          String unit = record.get(columns.getOrDefault("unit", "unit"));
          var units = db.queryForList("SELECT unit FROM metrics WHERE id=?", String.class, metric);
          if (units.isEmpty() || !Objects.equals(units.getFirst(), unit))
            throw new Exception("Đơn vị không khớp chỉ số.");
          if (db.queryForObject("SELECT count(*) FROM assets WHERE id=?", Long.class, asset) == 0)
            throw new Exception("Đối tượng không tồn tại.");
          String key = asset + ":" + metric + ":" + time;
          if (!seen.add(key)) throw new Exception("Trùng trong file.");
          if (db.queryForObject(
                  "SELECT count(*) FROM observations WHERE asset_id=? AND metric_id=? AND"
                      + " record_time=?",
                  Long.class,
                  asset,
                  metric,
                  time)
              > 0) throw new Exception("Đã có trong database.");
          row.putAll(
              Map.of(
                  "assetId",
                  asset,
                  "metricId",
                  metric,
                  "recordTime",
                  time.toString(),
                  "value",
                  value,
                  "unit",
                  unit));
          row.put("error", "");
        } catch (Exception e) {
          row.put("error", e.getMessage() == null ? "Sai định dạng dữ liệu." : e.getMessage());
        }
        rows.add(row);
      }
    }
    if (rows.isEmpty()) throw bad("CSV chưa có dữ liệu.");
    String id = UUID.randomUUID().toString();
    String digest =
        HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(file.getBytes()));
    String name = Objects.requireNonNullElse(file.getOriginalFilename(), "data.csv");
    name = name.substring(0, Math.min(255, name.length()));
    db.update(
        "INSERT INTO data_import_batches(id,owner_email,source,file_name,digest,rows_json) VALUES"
            + " (?::uuid,?,?,?,?,?::jsonb)",
        id,
        owner,
        source,
        name,
        digest,
        json.writeValueAsString(rows));
    return Map.of(
        "id",
        id,
        "rows",
        rows,
        "valid",
        rows.stream().allMatch(r -> "".equals(r.get("error"))),
        "source",
        source);
  }

  @PostMapping("/{id}/commit")
  Object commit(@PathVariable UUID id, @RequestHeader("Authorization") String token) {
    String owner = admin(token);
    return tx.execute(
        ignored -> {
          db.queryForList("SELECT pg_advisory_xact_lock(7813251)");
          var batches =
              db.queryForList(
                  "SELECT * FROM data_import_batches WHERE id=? AND owner_email=? FOR UPDATE",
                  id,
                  owner);
          if (batches.isEmpty()) throw bad("Không tìm thấy phiên nhập của tài khoản.");
          var batch = batches.getFirst();
          if ("COMMITTED".equals(batch.get("status")))
            return Map.of("inserted", batch.get("inserted_count"));
          List<Map<String, Object>> rows;
          try {
            rows = json.readValue(batch.get("rows_json").toString(), new TypeReference<>() {});
          } catch (Exception e) {
            throw bad("Không đọc được phiên nhập.");
          }
          for (var row : rows) {
            if (!"".equals(row.get("error"))) throw bad("Hãy sửa các dòng lỗi và xem trước lại.");
            long asset = ((Number) row.get("assetId")).longValue(),
                metric = ((Number) row.get("metricId")).longValue();
            var time = LocalDateTime.parse(row.get("recordTime").toString());
            if (db.queryForObject(
                    "SELECT count(*) FROM observations WHERE asset_id=? AND metric_id=? AND"
                        + " record_time=?",
                    Long.class,
                    asset,
                    metric,
                    time)
                > 0) throw bad("Dữ liệu thay đổi sau khi xem trước. Hãy xem trước lại.");
            db.update(
                "INSERT INTO observations(asset_id,metric_id,record_time,value) VALUES (?,?,?,?)",
                asset,
                metric,
                time,
                row.get("value"));
          }
          db.update(
              "UPDATE data_import_batches SET"
                  + " status='COMMITTED',committed_at=now(),inserted_count=? WHERE id=?",
              rows.size(),
              id);
          return Map.of("inserted", rows.size());
        });
  }

  private static ResponseStatusException bad(String message) {
    return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
  }
}
