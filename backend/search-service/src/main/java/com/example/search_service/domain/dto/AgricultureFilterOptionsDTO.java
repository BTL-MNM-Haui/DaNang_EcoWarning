package com.example.search_service.domain.dto;

import lombok.Data;
import java.util.Set;

@Data
public class AgricultureFilterOptionsDTO {

    private Set<String> units;

    private Set<String> crops;

    private Set<String> aspects;
}