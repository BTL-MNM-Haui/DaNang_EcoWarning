package com.example.search_service.util;

import com.example.search_service.domain.entity.Asset;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Component
public class AssetSpecification {
    public Specification<Asset> getMapAssets(String assetType) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.isNotNull(root.get("latitude")));
            predicates.add(cb.isNotNull(root.get("longitude")));

            if (StringUtils.hasText(assetType)) {
                predicates.add(cb.equal(root.get("assetType"), assetType));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public Specification<Asset> getNonGeoAssets(String assetType) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.or(
                    cb.isNull(root.get("latitude")),
                    cb.isNull(root.get("longitude"))
            ));

            if (StringUtils.hasText(assetType)) {
                predicates.add(cb.equal(root.get("assetType"), assetType));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}