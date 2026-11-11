package com.example.search_service.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Locale;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class YearlySummaryDTO {

    private Integer year;
    private String totalValue;

    public YearlySummaryDTO(Integer year, Long totalValueFromSum) {
        this.year = year;
        if (totalValueFromSum != null) {
            this.totalValue = String.format(Locale.US, "%d", totalValueFromSum);
        } else {
            this.totalValue = null;
        }
    }

    public YearlySummaryDTO(Integer year, Double totalValueFromSum) {
        this.year = year;
        if (totalValueFromSum != null) {
            this.totalValue = String.format(Locale.US, "%.2f", totalValueFromSum);
        } else {
            this.totalValue = null;
        }
    }
}
