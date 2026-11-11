package com.example.citizen_report_service.service.impl;

import com.cloudinary.utils.ObjectUtils;
import com.example.citizen_report_service.constant.ErrorMessage;
import com.example.citizen_report_service.domain.dto.UploadImageResult;
import com.example.citizen_report_service.domain.dto.request.ReportRequestDto;
import com.example.citizen_report_service.domain.dto.response.ReportResponseDto;
import com.example.citizen_report_service.domain.entity.Report;
import com.example.citizen_report_service.domain.entity.ReportStatus;
import com.example.citizen_report_service.domain.entity.ReportType;
import com.example.citizen_report_service.domain.mapper.ReportMapper;
import com.example.citizen_report_service.domain.validator.ReportValidator;
import com.example.citizen_report_service.exception.VsException;
import com.example.citizen_report_service.repository.ReportRepository;
import com.example.citizen_report_service.repository.ReportTypeRepository;
import com.example.citizen_report_service.service.CloudinaryService;
import com.example.citizen_report_service.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;

    private final ReportTypeRepository reportTypeRepository;

    private final ReportMapper reportMapper;

    private final CloudinaryService cloudinaryService;

    private final ReportValidator reportValidator;

    @Transactional
    public ReportResponseDto createReport(ReportRequestDto dto, MultipartFile imageFile) {
        reportValidator.validateCoordinates(dto.getLatitude(), dto.getLongitude());

        UploadImageResult imageResult = null;

        if (imageFile != null) {
            reportValidator.validateImage(imageFile);

            String reportTypeFolder = dto.getReportType();
            String uniqueFilename = UUID.randomUUID().toString();

            String publicId = reportTypeFolder + "/" + uniqueFilename;

            Map<String, Object> uploadOptions = ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", reportTypeFolder,
                    "overwrite", false
            );

            try {
                imageResult = cloudinaryService.uploadImage(imageFile, uploadOptions);
            } catch (Exception e) {
                throw new VsException(HttpStatus.BAD_REQUEST, ErrorMessage.ERR_UPLOAD_IMAGE_FAIL);
            }
        }

        ReportType reportType = reportTypeRepository.findByTypeCode(dto.getReportType())
                .orElseThrow(() -> new VsException(ErrorMessage.ERR_INVALID_REPORT + dto.getReportType()));

        reportValidator.validateTime(dto.getEventStartTime(), dto.getEventEndTime());

        Report report = reportMapper.requestToEntity(dto, reportType);

        report.setStatus(ReportStatus.PENDING);
        if (imageResult != null){
            report.setImageUrl(imageResult.getSecureUrl());
            report.setImagePublicId(imageResult.getPublicId());
        }

        Report savedReport = reportRepository.save(report);

        return reportMapper.entityToResponse(savedReport);
    }
}
