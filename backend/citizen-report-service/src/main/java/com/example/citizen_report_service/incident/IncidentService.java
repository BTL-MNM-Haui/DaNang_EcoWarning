package com.example.citizen_report_service.incident;

import com.example.citizen_report_service.domain.dto.request.ReportRequestDto;
import com.example.citizen_report_service.domain.validator.ReportValidator;
import com.example.citizen_report_service.service.CloudinaryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class IncidentService {
  private final JdbcTemplate db;
  private final TransactionTemplate tx;
  private final ReportValidator validator;
  private final CloudinaryService media;
  private final ObjectMapper json;
  private static final String SELECT =
      "SELECT"
          + " r.id,r.latitude,r.longitude,r.event_start_time,r.event_end_time,r.created_at,r.updated_at,r.address_text,r.report_description,r.status,r.incident_state,r.image_url,r.details::text"
          + " AS details,r.merged_into,r.version,t.type_code AS report_type,t.name AS"
          + " type_name,(r.updated_at<now()-interval '24 hours') AS stale FROM reports r JOIN"
          + " report_types t ON t.id=r.report_type_id ";

  public Object types() {
    return db.queryForList(
        "SELECT type_code AS code,name FROM report_types ORDER BY CASE WHEN type_code='FLOOD' THEN"
            + " 0 ELSE 1 END,name");
  }

  public Object list(Map<String, String> f, String owner, boolean admin) {
    StringBuilder sql = new StringBuilder(" WHERE 1=1 ");
    List<Object> args = new ArrayList<>();
    if (owner != null) {
      sql.append("AND r.owner_email=? ");
      args.add(owner);
    } else if (!admin) sql.append("AND r.status<>'REJECTED' ");
    if (!"true".equals(f.get("includeMerged"))) sql.append("AND r.merged_into IS NULL ");
    for (var e :
        Map.of("status", "r.status", "state", "r.incident_state", "type", "t.type_code").entrySet())
      if (f.get(e.getKey()) != null && !f.get(e.getKey()).isBlank()) {
        sql.append("AND ").append(e.getValue()).append("=? ");
        args.add(f.get(e.getKey()));
      }
    if (f.containsKey("since") && !f.get("since").isBlank()) {
      sql.append("AND r.updated_at>=? ");
      args.add(date(f.get("since")));
    }
    if (f.containsKey("q") && !f.get("q").isBlank()) {
      sql.append(
          "AND (coalesce(r.address_text,'') ILIKE ? OR coalesce(r.report_description,'') ILIKE ?)"
              + " ");
      String q = "%" + text(f.get("q"), 100) + "%";
      args.add(q);
      args.add(q);
    }
    if (f.containsKey("minDepth")) {
      sql.append(
          "AND CASE WHEN r.details->>'estimatedDepthCm' ~ '^[0-9]+(\\.[0-9]+)?$' THEN"
              + " (r.details->>'estimatedDepthCm')::numeric ELSE 0 END>=? ");
      args.add(number(f.get("minDepth"), 0, 1000));
    }
    long total =
        db.queryForObject(
            "SELECT count(*) FROM reports r JOIN report_types t ON t.id=r.report_type_id" + sql,
            Long.class,
            args.toArray());
    int page = (int) number(f.getOrDefault("page", "0"), 0, 100000),
        size = (int) number(f.getOrDefault("size", "50"), 1, 200);
    args.add(size);
    args.add(page * size);
    return Map.of(
        "items",
        db.queryForList(
            SELECT + sql + " ORDER BY r.updated_at DESC,r.id DESC LIMIT ? OFFSET ?",
            args.toArray()),
        "total",
        total,
        "page",
        page,
        "size",
        size);
  }

  public Map<String, Object> detail(long id, Authentication auth) {
    var row = find(id);
    String owner =
        db.queryForObject("SELECT owner_email FROM reports WHERE id=?", String.class, id);
    if ("REJECTED".equals(row.get("status"))
        && !(isAdmin(auth) || auth != null && auth.getName().equals(owner)))
      throw error(404, "Không tìm thấy báo cáo.");
    row.put(
        "events",
        db.queryForList(
            "SELECT id,event_type,note,image_url,created_at FROM incident_events WHERE report_id=?"
                + " ORDER BY created_at,id",
            id));
    row.put(
        "canUpdate",
        auth != null && !"REJECTED".equals(row.get("status")) && row.get("merged_into") == null);
    return row;
  }

  private Map<String, Object> find(long id) {
    var rows = db.queryForList(SELECT + "WHERE r.id=?", id);
    if (rows.isEmpty()) throw error(404, "Không tìm thấy báo cáo.");
    return rows.getFirst();
  }

  public Object create(ReportRequestDto request, MultipartFile image, String key, String owner) {
    if (key == null || !key.matches("[A-Za-z0-9_-]{16,100}"))
      throw error(400, "Mã gửi lại không hợp lệ.");
    var old = db.queryForList(SELECT + "WHERE r.owner_email=? AND r.request_key=?", owner, key);
    if (!old.isEmpty()) return old.getFirst();
    validator.validateCoordinates(request.getLatitude(), request.getLongitude());
    validator.validateTime(request.getEventStartTime(), request.getEventEndTime());
    if (request.getEventStartTime().isAfter(OffsetDateTime.now().plusMinutes(1)))
      throw error(400, "Thời gian ghi nhận không được ở tương lai.");
    String description = text(request.getReportDescription(), 500),
        address = text(request.getAddressText(), 500);
    if (description.isBlank()) throw error(400, "Vui lòng mô tả sự cố.");
    Long type =
        db
            .queryForList(
                "SELECT id FROM report_types WHERE type_code=?",
                Long.class,
                request.getReportType())
            .stream()
            .findFirst()
            .orElseThrow(() -> error(400, "Loại sự cố không hợp lệ."));
    String payload;
    try {
      payload =
          json.writeValueAsString(request.getDetails() == null ? Map.of() : request.getDetails());
      if (payload.length() > 2048) throw new Exception();
    } catch (Exception e) {
      throw error(400, "Chi tiết không hợp lệ hoặc quá dài.");
    }
    if (request.getDetails() instanceof Map<?, ?> map && map.containsKey("estimatedDepthCm"))
      number(map.get("estimatedDepthCm"), 0, 1000);
    // Upload happens before the transaction so network I/O does not hold database locks.
    String imageUrl = upload(image);
    return tx.execute(
        ignored -> {
          db.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))", owner + ":" + key);
          var existing =
              db.queryForList(SELECT + "WHERE r.owner_email=? AND r.request_key=?", owner, key);
          if (!existing.isEmpty()) return existing.getFirst();
          long id =
              db.queryForObject(
                  "INSERT INTO"
                      + " reports(report_type_id,latitude,longitude,event_start_time,event_end_time,created_at,updated_at,address_text,report_description,status,incident_state,owner_email,request_key,details,image_url)"
                      + " VALUES (?,?,?,?,?,now(),now(),?,?,'PENDING',?,?,?,?::jsonb,?) RETURNING"
                      + " id",
                  Long.class,
                  type,
                  request.getLatitude(),
                  request.getLongitude(),
                  request.getEventStartTime(),
                  request.getEventEndTime(),
                  address,
                  description,
                  request.getEventEndTime() == null ? "ACTIVE" : "RESOLVED",
                  owner,
                  key,
                  payload,
                  imageUrl);
          event(id, owner, "CREATED", "Báo cáo được tiếp nhận, đang chờ xác minh.", null, false);
          return find(id);
        });
  }

  public Object communityUpdate(long id, String note, MultipartFile image, Authentication auth) {
    String clean = text(note, 1000);
    if (clean.length() < 5) throw error(400, "Cập nhật cần ít nhất 5 ký tự.");
    String imageUrl = upload(image);
    return tx.execute(
        ignored -> {
          lock(id);
          var r = find(id);
          if ("REJECTED".equals(r.get("status")) || r.get("merged_into") != null)
            throw error(409, "Báo cáo bị từ chối hoặc đã gộp. Hãy cập nhật sự cố chính.");
          event(id, auth.getName(), "COMMUNITY_UPDATE", clean, imageUrl, false);
          return detail(id, auth);
        });
  }

  public Object moderate(long id, Map<String, Object> input, Authentication auth) {
    if (!isAdmin(auth)) throw error(403, "Cần quyền quản lý.");
    String note = text(input.get("note"), 800);
    if (note.length() < 5) throw error(400, "Cần ghi lý do ít nhất 5 ký tự.");
    return tx.execute(
        ignored -> {
          Long target =
              input.get("mergedInto") == null
                  ? null
                  : (long) number(input.get("mergedInto"), 1, Long.MAX_VALUE);
          if (target != null && target < id) {
            lock(target);
            lock(id);
          } else {
            lock(id);
            if (target != null) lock(target);
          }
          var row = find(id);
          long version = (long) number(input.get("version"), 0, Long.MAX_VALUE);
          if (((Number) row.get("version")).longValue() != version)
            throw error(409, "Báo cáo đã thay đổi. Hãy tải lại.");
          if (row.get("merged_into") != null)
            throw error(409, "Báo cáo đã gộp. Hãy cập nhật sự cố chính.");
          String status = input.getOrDefault("status", row.get("status")).toString(),
              state = input.getOrDefault("state", row.get("incident_state")).toString();
          if (!Set.of("PENDING", "VERIFIED", "REJECTED").contains(status)
              || !Set.of("ACTIVE", "RESOLVED", "UNKNOWN").contains(state))
            throw error(400, "Trạng thái không hợp lệ.");
          if (target != null) {
            var main = find(target);
            if (target == id
                || main.get("merged_into") != null
                || "REJECTED".equals(main.get("status")))
              throw error(409, "Sự cố đích không hợp lệ.");
            if (db.queryForObject(
                    "SELECT count(*) FROM reports WHERE merged_into=?", Long.class, id)
                > 0) throw error(409, "Hãy gộp trực tiếp vào sự cố chính đã có báo cáo liên kết.");
            db.update(
                "UPDATE reports SET merged_into=?,updated_at=now(),version=version+1 WHERE id=?",
                target,
                id);
            event(
                id, auth.getName(), "MERGED", note + " (Sự cố chính #" + target + ")", null, false);
            event(
                target,
                auth.getName(),
                "LINKED_REPORT",
                note + " (Báo cáo #" + id + ")",
                null,
                "VERIFIED".equals(main.get("status")));
          } else {
            db.update(
                "UPDATE reports SET status=?,incident_state=?,event_end_time=CASE WHEN ?='RESOLVED'"
                    + " THEN coalesce(event_end_time,now()) ELSE NULL"
                    + " END,updated_at=now(),version=version+1 WHERE id=?",
                status,
                state,
                state,
                id);
            event(
                id,
                auth.getName(),
                "MODERATED",
                note + " [" + status + " / " + state + "]",
                null,
                "VERIFIED".equals(status));
          }
          return detail(id, auth);
        });
  }

  private void lock(long id) {
    if (db.queryForList("SELECT id FROM reports WHERE id=? FOR UPDATE", id).isEmpty())
      throw error(404, "Không tìm thấy báo cáo.");
  }

  private void event(
      long id, String actor, String kind, String note, String image, boolean notify) {
    long event =
        db.queryForObject(
            "INSERT INTO incident_events(report_id,actor_email,event_type,note,image_url) VALUES"
                + " (?,?,?,?,?) RETURNING id",
            Long.class,
            id,
            actor,
            kind,
            note,
            image);
    if (notify)
      db.update(
          "INSERT INTO incident_notifications(owner_email,report_id,event_id,message) SELECT"
              + " DISTINCT w.owner_email,r.id,?,? FROM watch_areas w CROSS JOIN reports r WHERE"
              + " r.id=? AND"
              + " 6371*2*asin(sqrt(least(1.0,power(sin(radians((r.latitude-w.latitude)/2)),2)+cos(radians(w.latitude))*cos(radians(r.latitude))*power(sin(radians((r.longitude-w.longitude)/2)),2))))<=w.radius_km"
              + " ON CONFLICT DO NOTHING",
          event,
          "Sự cố #" + id + " cập nhật: " + note,
          id);
  }

  public Object watches(String owner) {
    return db.queryForList(
        "SELECT id,name,latitude,longitude,radius_km,created_at FROM watch_areas WHERE"
            + " owner_email=? ORDER BY id DESC",
        owner);
  }

  public Object watch(Map<String, Object> input, String owner) {
    String name = text(input.get("name"), 100);
    if (name.isBlank()) throw error(400, "Cần tên khu vực.");
    double lat = number(input.get("latitude"), 15.9, 16.3),
        lon = number(input.get("longitude"), 107.8, 108.4),
        radius = number(input.get("radiusKm"), 0.1, 20);
    return tx.execute(
        ignored -> {
          db.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))", owner);
          if (db.queryForObject(
                  "SELECT count(*) FROM watch_areas WHERE owner_email=?", Long.class, owner)
              >= 20) throw error(400, "Tối đa 20 khu vực mỗi tài khoản.");
          db.update(
              "INSERT INTO watch_areas(owner_email,name,latitude,longitude,radius_km) VALUES"
                  + " (?,?,?,?,?)",
              owner,
              name,
              lat,
              lon,
              radius);
          return watches(owner);
        });
  }

  public void removeWatch(long id, String owner) {
    if (db.update("DELETE FROM watch_areas WHERE id=? AND owner_email=?", id, owner) == 0)
      throw error(404, "Không tìm thấy khu vực.");
  }

  public Object notifications(String owner) {
    return db.queryForList(
        "SELECT id,report_id,message,read_at,created_at FROM incident_notifications WHERE"
            + " owner_email=? ORDER BY id DESC LIMIT 100",
        owner);
  }

  public void readNotification(long id, String owner) {
    if (db.update(
            "UPDATE incident_notifications SET read_at=coalesce(read_at,now()) WHERE id=? AND"
                + " owner_email=?",
            id,
            owner)
        == 0) throw error(404, "Không tìm thấy thông báo.");
  }

  public Object recurrence() {
    return db.queryForList(
        "SELECT round(latitude::numeric,2) AS latitude,round(longitude::numeric,2) AS"
            + " longitude,count(*) AS incident_count,min(event_start_time) AS"
            + " first_recorded,max(event_start_time) AS last_recorded FROM reports r JOIN"
            + " report_types t ON t.id=r.report_type_id WHERE r.status='VERIFIED' AND r.merged_into"
            + " IS NULL AND t.type_code='FLOOD' GROUP BY 1,2 HAVING count(*)>1 ORDER BY"
            + " incident_count DESC LIMIT 100");
  }

  private String upload(MultipartFile file) {
    if (file == null || file.isEmpty()) return null;
    validator.validateImage(file);
    try {
      if (javax.imageio.ImageIO.read(file.getInputStream()) == null)
        throw error(400, "File không phải ảnh hợp lệ.");
    } catch (java.io.IOException e) {
      throw error(400, "Không đọc được ảnh.");
    }
    try {
      return media
          .uploadImage(file, Map.of("folder", "ecowarning/reports", "resource_type", "image"))
          .getSecureUrl();
    } catch (Exception e) {
      throw error(503, "Chưa lưu được ảnh. Hãy thử lại; nội dung vẫn còn trong bản nháp.");
    }
  }

  public static boolean isAdmin(Authentication auth) {
    return auth != null
        && auth.getAuthorities().stream()
            .anyMatch(a -> Set.of("ROLE_ADMIN", "ROLE_MODERATOR").contains(a.getAuthority()));
  }

  private static String text(Object input, int max) {
    String v = input == null ? "" : input.toString().trim();
    if (v.length() > max) throw error(400, "Nội dung vượt quá " + max + " ký tự.");
    return v;
  }

  private static double number(Object input, double min, double max) {
    try {
      double n = Double.parseDouble(String.valueOf(input));
      if (!Double.isFinite(n) || n < min || n > max) throw new Exception();
      return n;
    } catch (Exception e) {
      throw error(400, "Giá trị số không hợp lệ hoặc ngoài phạm vi.");
    }
  }

  private static OffsetDateTime date(String value) {
    try {
      return OffsetDateTime.parse(value);
    } catch (Exception e) {
      throw error(400, "Thời gian cần ở định dạng ISO có múi giờ.");
    }
  }

  private static ResponseStatusException error(int status, String message) {
    return new ResponseStatusException(HttpStatus.valueOf(status), message);
  }
}
