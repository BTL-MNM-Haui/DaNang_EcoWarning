package com.example.collector_data_service.helper;

import com.example.collector_data_service.constant.LogMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class InitDataHelper {
    private static final Logger log = LoggerFactory.getLogger(InitDataHelper.class);

    public Double parseSafeDouble(String valueStr) {
        if (valueStr == null || valueStr.trim().isEmpty() || valueStr.trim().equals("-")) {
            return null;
        }
        try {
            String sanitizedString = valueStr.trim().replace(",", "");

            if (sanitizedString.indexOf('.') != sanitizedString.lastIndexOf('.')) {
                log.warn(LogMessage.ERR_LOAD_DOUBLE_FAIL, valueStr);
                return null;
            }

            return Double.parseDouble(sanitizedString);
        } catch (NumberFormatException e) {
            log.warn(LogMessage.ERR_LOAD_DOUBLE_FAIL, valueStr);
            return null;
        }
    }
}
