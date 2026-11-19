package com.example.search_service.domain.dto.response;

import java.util.*;
import java.time.LocalDateTime;
import lombok.Getter;

@Getter
public class ObservationQuality {
    private final int totalRecords;
    private final int uniqueTimestamps;
    private int conflictTimestamps;
    private int conflictRecords;
    private int repeatedRecords;
    private int missingValues;
    private int usablePoints;
    private final List<TimeSeriesDataPoint> trendSeries = new ArrayList<>();

    public ObservationQuality(List<TimeSeriesDataPoint> points) {
        totalRecords = points.size();
        Map<LocalDateTime, List<TimeSeriesDataPoint>> grouped = new TreeMap<>();
        for (var point : points) grouped.computeIfAbsent(point.getTimestamp(), k -> new ArrayList<>()).add(point);
        uniqueTimestamps = grouped.size();
        for (var group : grouped.values()) {
            var valid = group.stream().filter(p -> p.getValue() != null).toList();
            missingValues += group.size() - valid.size();
            long distinctValues = valid.stream().map(TimeSeriesDataPoint::getValue).distinct().count();
            if (distinctValues > 1) {
                conflictTimestamps++;
                conflictRecords += valid.size();
                valid.forEach(p -> p.setQuality("CONFLICT"));
                // A null trend value preserves the gap instead of joining across a conflict.
                trendSeries.add(new TimeSeriesDataPoint(group.getFirst().getTimestamp(), "CONFLICT"));
            } else if (!valid.isEmpty()) {
                var first = valid.getFirst();
                trendSeries.add(first);
                usablePoints++;
                if (valid.size() > 1) {
                    repeatedRecords += valid.size() - 1;
                    valid.forEach(p -> p.setQuality("REPEATED"));
                }
            } else trendSeries.add(group.getFirst());
        }
    }

}
