package com.example.citizen_report_service.domain.validator;

import com.example.citizen_report_service.constant.CommonConstant;
import com.example.citizen_report_service.constant.ErrorMessage;
import com.example.citizen_report_service.exception.VsException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Component
public class ReportValidator {
    public void validateCoordinates(BigDecimal lat, BigDecimal lon) {
        if (lat == null || lon == null) {
            throw new VsException(ErrorMessage.ERR_COORDINATES_NULL);
        }

        boolean isValidLat = lat.compareTo(CommonConstant.DANANG_MIN_LAT) >= 0 && lat.compareTo(CommonConstant.DANANG_MAX_LAT) <= 0;
        boolean isValidLon = lon.compareTo(CommonConstant.DANANG_MIN_LON) >= 0 && lon.compareTo(CommonConstant.DANANG_MAX_LON) <= 0;

        if (!isValidLat || !isValidLon) {
            throw new VsException(ErrorMessage.ERR_COORDINATES_NOT_VALID);
        }
    }

    public void validateImage(MultipartFile file) {
        if (file.getSize() > CommonConstant.IMAGE_MAX_SIZE) {
            throw new VsException(ErrorMessage.ERR_IMAGE_SIZE_TOO_LARGE);
        }

        String contentType = file.getContentType();
        if (contentType == null || !isSupportedContentType(contentType)) {
            throw new VsException(ErrorMessage.ERR_IMAGE_TYPE_UNSUPPORTED);
        }
    }

    public void validateTime(OffsetDateTime eventStartTime, OffsetDateTime eventEndTime) {
        if (eventStartTime == null)
            throw new VsException(ErrorMessage.ERR_REPORT_START_TIME_NOT_FOUND);

        if (eventEndTime != null && eventStartTime != null) {
            if (eventEndTime.isBefore(eventStartTime) || eventEndTime.isEqual(eventStartTime))
                throw new VsException(ErrorMessage.ERR_REPORT_TIME_NOT_VALID);
        }

        if (eventStartTime.isBefore(OffsetDateTime.now().minusHours(168)))
            throw new VsException(ErrorMessage.ERR_REPORT_TIME_TOO_OLD);
    }

    private boolean isSupportedContentType(String contentType) {
        return contentType.equals(CommonConstant.IMAGE_TYPE_JPEG) ||
                contentType.equals(CommonConstant.IMAGE_TYPE_PNG) ||
                contentType.equals(CommonConstant.IMAGE_TYPE_WEBP);
    }
}