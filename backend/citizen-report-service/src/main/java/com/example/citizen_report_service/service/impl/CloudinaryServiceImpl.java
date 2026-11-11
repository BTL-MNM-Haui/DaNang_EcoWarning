package com.example.citizen_report_service.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.citizen_report_service.domain.dto.UploadImageResult;
import com.example.citizen_report_service.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    @Override
    public UploadImageResult uploadImage(MultipartFile file, Map<String, Object> options) throws IOException {
        Map<String, Object> uploadOptions = (options != null) ? options : ObjectUtils.emptyMap();

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                uploadOptions
        );

        String publicId = (String) uploadResult.get("public_id");
        String secureUrl = (String) uploadResult.get("secure_url");

        return new UploadImageResult(publicId, secureUrl);
    }

    @Override
    public void deleteImage(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}
