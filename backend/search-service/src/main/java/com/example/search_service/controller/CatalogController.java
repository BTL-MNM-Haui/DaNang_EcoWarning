package com.example.search_service.controller;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/metric/catalog")
@RequiredArgsConstructor
public class CatalogController {
  private final JdbcTemplate db;

  @GetMapping
  public Object catalog() {
    return Map.of(
        "assets",
            db.queryForList(
                "SELECT a.id,a.name,a.asset_type,min(o.record_time) AS"
                    + " first_recorded,max(o.record_time) AS last_recorded FROM assets a JOIN"
                    + " observations o ON a.id=o.asset_id GROUP BY a.id,a.name,a.asset_type ORDER"
                    + " BY a.name"),
        "metrics",
            db.queryForList("SELECT id,name,category,unit FROM metrics ORDER BY category,name"),
        "years",
            db.queryForList(
                "SELECT DISTINCT extract(year FROM record_time)::int AS year FROM observations"
                    + " ORDER BY year DESC"),
        "source",
            "Dữ liệu lịch sử được nhập từ CSV; thời điểm quan trắc không phải thời điểm cập nhật"
                + " trực tiếp.");
  }
}
