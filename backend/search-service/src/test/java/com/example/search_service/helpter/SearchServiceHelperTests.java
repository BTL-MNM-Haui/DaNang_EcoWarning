package com.example.search_service.helpter;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class SearchServiceHelperTests {
 @Test void normalizesLabelsWithoutConvertingValues() {
  assertEquals("ha",SearchServiceHelper.cleanUnit(" ĐVT: Ha "));
  assertEquals("%",SearchServiceHelper.cleanUnit("ĐVT:%"));
  assertEquals("giờ",SearchServiceHelper.cleanUnit("ĐVT: Giờ"));
  assertEquals("1000 bông",SearchServiceHelper.cleanUnit("1000 bông"));
  assertNull(SearchServiceHelper.cleanUnit(null));
 }
}
