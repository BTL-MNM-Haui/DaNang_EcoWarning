package com.example.citizen_report_service.service;

import com.example.citizen_report_service.domain.dto.request.ReportRequestDto;
import com.example.citizen_report_service.domain.dto.response.ReportResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public interface ReportService {
    ReportResponseDto createReport(ReportRequestDto dto, MultipartFile imageFile);
}
