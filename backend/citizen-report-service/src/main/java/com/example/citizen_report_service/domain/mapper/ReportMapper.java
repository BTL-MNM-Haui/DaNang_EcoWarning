package com.example.citizen_report_service.domain.mapper;

import com.example.citizen_report_service.constant.ErrorMessage;
import com.example.citizen_report_service.domain.dto.FallenTreeDetailsDto;
import com.example.citizen_report_service.domain.dto.FloodDetailsDto;
import com.example.citizen_report_service.domain.dto.ForestFireDetailsDto;
import com.example.citizen_report_service.domain.dto.SevereTrafficJamDetailsDto;
import com.example.citizen_report_service.domain.dto.request.ReportRequestDto;
import com.example.citizen_report_service.domain.dto.response.ReportResponseDto;
import com.example.citizen_report_service.domain.entity.Report;
import com.example.citizen_report_service.domain.entity.ReportType;
import com.example.citizen_report_service.exception.VsException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class ReportMapper {

    @Autowired
    protected ObjectMapper objectMapper;

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "reportType", source = "reportTypeEntity")
    @Mapping(target = "imageUrl", ignore = true)
    @Mapping(target = "imagePublicId", ignore = true)
    @Mapping(target = "details", expression = "java(objectToJsonString(dto.getDetails(), dto.getReportType()))")
    public abstract Report requestToEntity(ReportRequestDto dto, ReportType reportTypeEntity);

    @Mapping(target = "reportType", source = "entity.reportType.typeCode")
    @Mapping(target = "details", expression = "java(jsonStringToObject(entity.getDetails()))")
    public abstract ReportResponseDto entityToResponse(Report entity);

    protected String objectToJsonString(Object details, String reportType) {
        if (details == null) {
            return "{}";
        }
        try {
            Object validatedDto = switch (reportType) {
                case "FALLEN_TREE" -> objectMapper.convertValue(details, FallenTreeDetailsDto.class);
                case "FLOOD" -> objectMapper.convertValue(details, FloodDetailsDto.class);
                case "FOREST_FIRE" -> objectMapper.convertValue(details, ForestFireDetailsDto.class);
                case "SEVERE_TRAFFIC_JAM" -> objectMapper.convertValue(details, SevereTrafficJamDetailsDto.class);
                default -> details;
            };

            String json = objectMapper.writeValueAsString(validatedDto);
            if (json.length() > 2048) { // 2 KB
                throw new VsException(ErrorMessage.ERR_REPORT_DETAILS_TOO_LONG);
            }

            return objectMapper.writeValueAsString(validatedDto);
        } catch (Exception e) {
            throw new VsException(ErrorMessage.ERR_DETAILS_NOT_VALID + e.getMessage());
        }
    }


    protected Object jsonStringToObject(String detailsJson) {
        if (detailsJson == null || detailsJson.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(detailsJson, Object.class);
        } catch (JsonProcessingException e) {
            System.err.println(ErrorMessage.ERR_PARSE_JSON_FAIL);
            return null;
        }
    }
}
