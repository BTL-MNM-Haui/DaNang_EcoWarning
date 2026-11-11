package com.example.citizen_report_service.controller;

import com.example.citizen_report_service.domain.dto.request.ReportRequestDto;
import com.example.citizen_report_service.incident.IncidentService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReportController {
  private final IncidentService incidents;

  @GetMapping("/reports/types")
  Object types() {
    return incidents.types();
  }

  @GetMapping("/reports")
  Object list(@RequestParam Map<String, String> filters) {
    return incidents.list(filters, null, false);
  }

  @GetMapping("/reports/mine")
  Object mine(@RequestParam Map<String, String> filters, Authentication auth) {
    return incidents.list(filters, auth.getName(), false);
  }

  @GetMapping("/admin/reports")
  Object queue(@RequestParam Map<String, String> filters) {
    return incidents.list(filters, null, true);
  }

  @GetMapping("/reports/recurrence")
  Object recurrence() {
    return incidents.recurrence();
  }

  @GetMapping("/reports/{id}")
  Object detail(@PathVariable long id, Authentication auth) {
    return incidents.detail(id, auth);
  }

  @PostMapping(
      value = {"/reports", "/report/send-report"},
      consumes = "multipart/form-data")
  Object create(
      @RequestPart("request") @Valid ReportRequestDto request,
      @RequestPart(value = "image", required = false) MultipartFile image,
      @RequestHeader("Idempotency-Key") String key,
      Authentication auth) {
    return incidents.create(request, image, key, auth.getName());
  }

  @PostMapping(value = "/reports/{id}/updates", consumes = "multipart/form-data")
  Object update(
      @PathVariable long id,
      @RequestParam String note,
      @RequestPart(value = "image", required = false) MultipartFile image,
      Authentication auth) {
    return incidents.communityUpdate(id, note, image, auth);
  }

  @PatchMapping("/admin/reports/{id}")
  Object moderate(
      @PathVariable long id, @RequestBody Map<String, Object> request, Authentication auth) {
    return incidents.moderate(id, request, auth);
  }

  @GetMapping("/watch-areas")
  Object watches(Authentication auth) {
    return incidents.watches(auth.getName());
  }

  @PostMapping("/watch-areas")
  Object watch(@RequestBody Map<String, Object> request, Authentication auth) {
    return incidents.watch(request, auth.getName());
  }

  @DeleteMapping("/watch-areas/{id}")
  void removeWatch(@PathVariable long id, Authentication auth) {
    incidents.removeWatch(id, auth.getName());
  }

  @GetMapping("/notifications")
  Object notifications(Authentication auth) {
    return incidents.notifications(auth.getName());
  }

  @PatchMapping("/notifications/{id}/read")
  void read(@PathVariable long id, Authentication auth) {
    incidents.readNotification(id, auth.getName());
  }
}
