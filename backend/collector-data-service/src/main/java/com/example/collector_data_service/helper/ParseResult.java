package com.example.collector_data_service.helper;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ParseResult {
    private final int recordsProcessed;
    private final int recordsInserted;

    public static ParseResult zero() {
        return new ParseResult(0, 0);
    }
}