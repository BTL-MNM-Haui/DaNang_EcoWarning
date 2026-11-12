package com.example.search_service.helpter;

import java.text.Normalizer;
import java.util.Locale;

public class SearchServiceHelper {
    // Presentation only: never rescale an observation or rewrite the stored unit.
    public static String cleanUnit(String rawUnit) {
        if (rawUnit == null) return null;
        String unit = Normalizer.normalize(rawUnit, Normalizer.Form.NFC).trim()
                .replaceAll("(?iu)^đvt\\s*[:：]?\\s*", "").trim();
        return switch (unit.toLowerCase(Locale.ROOT)) {
            case "ha" -> "ha";
            case "cm" -> "cm";
            case "mm" -> "mm";
            case "tấn" -> "tấn";
            case "tạ/ha" -> "tạ/ha";
            case "giờ" -> "giờ";
            default -> unit;
        };
    }
}
