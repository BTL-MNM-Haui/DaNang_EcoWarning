package com.example.search_service.util;

import com.example.search_service.domain.dto.ObservationSearchCriteria;
import com.example.search_service.domain.entity.Asset;
import com.example.search_service.domain.entity.Metric;
import com.example.search_service.domain.entity.Observation;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class ObservationSpecification {

    public Specification<Observation> build(ObservationSearchCriteria criteria) {
        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            Join<Observation, Asset> assetJoin = root.join("asset", JoinType.LEFT);
            Join<Observation, Metric> metricJoin = root.join("metric", JoinType.LEFT);

            if (StringUtils.hasText(criteria.getQ())) {
                String likePattern = "%" + criteria.getQ().toLowerCase() + "%";

                predicates.add(cb.or(
                        cb.like(cb.lower(assetJoin.get("name")), likePattern),
                        cb.like(cb.lower(metricJoin.get("name")), likePattern)
                ));
            }

            if (StringUtils.hasText(criteria.getAssetId())) {
                try {
                    predicates.add(cb.equal(assetJoin.get("id"), Long.parseLong(criteria.getAssetId())));
                } catch (IllegalArgumentException e) {
                    predicates.add(cb.equal(cb.literal(1), 0));
                }
            }
            if (StringUtils.hasText(criteria.getMetricId())) {
                try {
                    predicates.add(cb.equal(metricJoin.get("id"), Long.parseLong(criteria.getMetricId())));
                } catch (IllegalArgumentException e) {
                    predicates.add(cb.equal(cb.literal(1), 0));
                }
            }

            if (criteria.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("recordTime"), criteria.getFromDate().atStartOfDay()));
            }
            if (criteria.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("recordTime"), criteria.getToDate().atTime(LocalTime.MAX)));
            }

            if (StringUtils.hasText(criteria.getAssetType())) {
                predicates.add(cb.equal(assetJoin.get("assetType"), criteria.getAssetType()));
            }
            if (StringUtils.hasText(criteria.getDistrict())) {
                predicates.add(cb.equal(assetJoin.get("district"), criteria.getDistrict()));
            }
            if (StringUtils.hasText(criteria.getMetricCategory())) {
                predicates.add(cb.equal(metricJoin.get("category"), criteria.getMetricCategory()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

