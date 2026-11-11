package com.example.search_service.helpter;

public class SearchServiceHelper {
    public static String cleanUnit(String rawUnit) {
        if (rawUnit == null) return null;
        String cleaned = rawUnit.trim();
        if (cleaned.toLowerCase().startsWith("đvt")) {
            cleaned = cleaned.replaceAll("(?i)^đvt[: ]*", "").trim();
        }
        return cleaned;
    }
}
