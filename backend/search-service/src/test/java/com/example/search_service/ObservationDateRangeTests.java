package com.example.search_service;

import com.example.search_service.domain.dto.ObservationSearchCriteria;
import com.example.search_service.domain.entity.Observation;
import com.example.search_service.util.ObservationSpecification;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalDateTime;
import static org.mockito.Mockito.*;

class ObservationDateRangeTests {
    @Test @SuppressWarnings("unchecked")
    void endDateUsesExclusiveNextMidnightInsteadOfRoundedEndOfDay() {
        Root<Observation> root = mock(Root.class);
        Path<LocalDateTime> path = mock(Path.class);
        when(root.<LocalDateTime>get("recordTime")).thenReturn(path);
        var cb = mock(CriteriaBuilder.class);
        var criteria = new ObservationSearchCriteria();
        criteria.setFromDate(LocalDate.of(2023, 1, 1));
        criteria.setToDate(LocalDate.of(2023, 12, 31));
        new ObservationSpecification().build(criteria).toPredicate(root, mock(CriteriaQuery.class), cb);
        verify(cb).greaterThanOrEqualTo(path, LocalDateTime.of(2023, 1, 1, 0, 0));
        verify(cb).lessThan(path, LocalDateTime.of(2024, 1, 1, 0, 0));
        verify(cb, never()).lessThanOrEqualTo(eq(path), any(LocalDateTime.class));
    }
}
