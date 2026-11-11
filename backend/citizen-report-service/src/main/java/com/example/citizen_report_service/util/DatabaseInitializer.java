package com.example.citizen_report_service.util;

import com.example.citizen_report_service.constant.LogMessage;
import com.example.citizen_report_service.domain.entity.ReportType;
import com.example.citizen_report_service.repository.ReportTypeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseInitializer {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    @Bean
    CommandLineRunner initReportTypes(ReportTypeRepository reportTypeRepository) {

        return args -> {
            if (reportTypeRepository.count() > 0) {
                log.info(LogMessage.REPORT_TYPE_ALREADY_INITIALIZED);
                return;
            }

            log.info(LogMessage.REPORT_TYPE_INIT_START);

            // --- Nhóm 1: Thời tiết ---
            ReportType storm = new ReportType(null, "STORM", "Bão / Áp thấp", "Cảnh báo khu vực ảnh hưởng bão");
            ReportType highWind = new ReportType(null, "HIGH_WIND", "Lốc xoáy / Gió giật", "Khu vực có gió lớn gây nguy hiểm");
            ReportType lightning = new ReportType(null, "LIGHTNING", "Sét", "Khu vực vừa bị sét đánh hoặc thường xuyên có sét");

            // --- Nhóm 2: Nước ---
            ReportType flood = new ReportType(null, "FLOOD", "Ngập lụt", "Khu vực bị ngập lụt");
            ReportType flashFlood = new ReportType(null, "FLASH_FLOOD", "Lũ quét", "Khu vực xảy ra lũ quét");
            ReportType landslide = new ReportType(null, "LANDSLIDE", "Sạt lở", "Khu vực xảy ra sạt lở đất đá");

            // --- Nhóm 3: Cháy ---
            ReportType forestFire = new ReportType(null, "FOREST_FIRE", "Cháy rừng", "Báo cáo các cuộc cháy rừng");
            ReportType urbanFire = new ReportType(null, "URBAN_FIRE", "Cháy nổ (KDC/Công nghiệp)", "Báo cáo cháy nổ ở khu dân cư, KCN");

            // --- Nhóm 4: Hạ tầng ---
            ReportType fallenTree = new ReportType(null, "FALLEN_TREE", "Cây ngã / đổ", "Cây đổ chắn đường gây nguy hiểm");
            ReportType powerLineDown = new ReportType(null, "POWER_LINE_DOWN", "Đứt dây điện", "Cột điện đổ hoặc dây điện đứt");
            ReportType trafficJam = new ReportType(null, "SEVERE_TRAFFIC_JAM", "Kẹt xe nghiêm trọng", "Kẹt xe do thiên tai (ngập, cây đổ)");

            reportTypeRepository.saveAll(List.of(
                    storm, highWind, lightning,
                    flood, flashFlood, landslide,
                    forestFire, urbanFire,
                    fallenTree, powerLineDown, trafficJam
            ));

            log.info(LogMessage.REPORT_TYPE_INIT_FINISHED);
        };
    }
}
