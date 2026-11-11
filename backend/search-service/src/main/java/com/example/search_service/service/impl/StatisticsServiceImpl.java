package com.example.search_service.service.impl;

import com.example.search_service.domain.dto.AgricultureFilterOptionsDTO;
import com.example.search_service.domain.dto.MetricValueDTO;
import com.example.search_service.domain.dto.response.AssetTypeCountDTO;
import com.example.search_service.domain.dto.response.MetricYearlySummaryDTO;
import com.example.search_service.domain.dto.response.YearlySummaryDTO;
import com.example.search_service.repository.AssetSearchRepository;
import com.example.search_service.repository.MetricRepository;
import com.example.search_service.repository.ObservationSearchRepository;
import com.example.search_service.service.StatisticsService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatisticsServiceImpl implements StatisticsService {
    private final AssetSearchRepository assetRepository;
    private final ObservationSearchRepository observationRepository;
    private final MetricRepository metricRepository;

    private static final String CATEGORY_DISASTER_DAMAGE = "Thiệt hại thiên tai";
    private static final String UNIT_MONEY = "Tỷ đồng";

    private static final String CATEGORY_AGRICULTURE = "Nông nghiệp";

    private static final Set<String> ASPECT_KEYWORDS = Set.of(
            "diện tích", "sản lượng", "năng suất", "thu hoạch", "gieo trồng",
            "trồng", "cây lâu năm", "hiện có", "lương thực có hạt"
    );

    private static final Set<String> NOISE_KEYWORDS = Set.of(
            "tấn", "ha", "tạ/ha", "bông", "người", "nhà", "%", "đồng",
            "1000 bông", "đvt"
    );


    @Override
    public List<AssetTypeCountDTO> getAssetCountsByType() {
        return assetRepository.countAssetsByType();
    }

    @Override
    public List<YearlySummaryDTO> getDisasterDamageSummaryByYear() {
        return observationRepository.getYearlySummaryByCategoryAndUnit(
                CATEGORY_DISASTER_DAMAGE,
                UNIT_MONEY
        );
    }

    @Override
    public List<MetricValueDTO> getDisasterDamageDetailsByYear(Integer year) {
        return observationRepository.getDetailedSummaryByCategoryAndYear(
                CATEGORY_DISASTER_DAMAGE,
                year
        );
    }

    @Override
    public List<MetricYearlySummaryDTO> searchAgricultureSummary(String unit, String crop, String aspect) {
        String unitFilter = StringUtils.hasText(unit) ? unit : "%";
        String cropPattern = StringUtils.hasText(crop) ? (crop + "%") : "%";
        String aspectPattern = StringUtils.hasText(aspect) ? ("% " + aspect) : "%";

        return observationRepository.searchAgricultureSummary(
                CATEGORY_AGRICULTURE,
                unitFilter,
                cropPattern,
                aspectPattern
        );
    }

    @Override
    public AgricultureFilterOptionsDTO getAgricultureFilterOptions() {
        AgricultureFilterOptionsDTO options = new AgricultureFilterOptionsDTO();
        Set<String> units = new HashSet<>();
        Set<String> crops = new HashSet<>();
        Set<String> aspects = new HashSet<>();

        List<Object[]> results = metricRepository.findNameAndUnitByCategory(CATEGORY_AGRICULTURE);

        for (Object[] result : results) {
            String name = (String) result[0];
            String unit = (String) result[1];

            if (StringUtils.hasText(unit)) {
                units.add(cleanUnit(unit));
            }

            if (!StringUtils.hasText(name)) {
                continue;
            }
            String cleanedName = name.trim();
            String lowerCleanedName = cleanedName.toLowerCase();

            if (isNoiseKeyword(lowerCleanedName)) {
                continue;
            }

            String[] parts = cleanedName.split(" - ", 2);

            if (parts.length == 2) {
                String part1 = parts[0].trim();
                String part2 = parts[1].trim();
                String lowerPart1 = part1.toLowerCase();
                String lowerPart2 = part2.toLowerCase();

                if (isAspectKeyword(lowerPart1) && !isAspectKeyword(lowerPart2) && !isNoiseKeyword(lowerPart2)) {
                    aspects.add(part1);
                    crops.add(part2);
                } else if (!isAspectKeyword(lowerPart1) && !isNoiseKeyword(lowerPart1) && isAspectKeyword(lowerPart2)) {
                    crops.add(part1);
                    aspects.add(part2);
                } else if (!isNoiseKeyword(lowerPart1) && !isNoiseKeyword(lowerPart2)) {
                    crops.add(part1);
                    aspects.add(part2);
                }

            } else if (parts.length == 1) {
                String singleName = parts[0].trim();
                String lowerSingleName = singleName.toLowerCase();

                if (isAspectKeyword(lowerSingleName)) {
                    aspects.add(singleName);
                } else if (!isNoiseKeyword(lowerSingleName) && !singleName.isEmpty()) {
                    crops.add(singleName);
                }
            }
        }

        options.setUnits(units.stream().sorted().collect(Collectors.toSet()));
        options.setCrops(crops.stream().sorted().collect(Collectors.toSet()));
        options.setAspects(aspects.stream().sorted().collect(Collectors.toSet()));

        return options;
    }


    private String cleanUnit(String rawUnit) {
        if (rawUnit == null) return null;
        String cleaned = rawUnit.trim();

        if (cleaned.toLowerCase().startsWith("đvt")) {
            cleaned = cleaned.replaceAll("(?i)^đvt[: ]*", "").trim();
        }
        return cleaned;
    }

    private boolean isAspectKeyword(String lowerCaseText) {
        if (lowerCaseText == null) return false;
        return ASPECT_KEYWORDS.stream().anyMatch(lowerCaseText::contains);
    }

    private boolean isNoiseKeyword(String lowerCaseText) {
        if (lowerCaseText == null) return false;
        String cleanedUnit = cleanUnit(lowerCaseText);
        return NOISE_KEYWORDS.stream().anyMatch(key -> lowerCaseText.equals(key) || (cleanedUnit != null && cleanedUnit.equals(key)));
    }
}
