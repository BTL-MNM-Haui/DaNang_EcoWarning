package com.example.citizen_report_service.service;

import com.example.citizen_report_service.domain.dto.UploadImageResult;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public interface CloudinaryService {
    UploadImageResult uploadImage(MultipartFile file, Map<String, Object> options) throws IOException;

    void deleteImage(String publicId) throws IOException;
}
