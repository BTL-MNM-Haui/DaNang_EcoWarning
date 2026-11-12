package com.example.search_service.domain.dto.response;
import com.example.search_service.domain.entity.Observation;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class ObservationQualityTests {
 private TimeSeriesDataPoint point(int year, Double value) {
  var o = new Observation();o.setRecordTime(LocalDateTime.of(year,1,1,0,0));o.setValue(value);return new TimeSeriesDataPoint(o);
 }
 @Test void conflictsArePreservedButBreakTheTrend() {
  var a=point(2021,18.0);var b=point(2022,18.0);var c=point(2022,17.5);var d=point(2023,17.0);
  var q=new ObservationQuality(List.of(a,b,c,d));
  assertEquals(4,q.getTotalRecords());assertEquals(1,q.getConflictTimestamps());assertEquals(2,q.getConflictRecords());assertEquals(2,q.getUsablePoints());
  assertEquals("CONFLICT",b.getQuality());assertEquals("18",b.getValue());assertEquals("17.5",c.getValue());assertNull(q.getTrendSeries().get(1).getValue());
 }
 @Test void identicalRepeatsAreCountedOnceAndMissingValuesStayMissing() {
  var q=new ObservationQuality(List.of(point(2021,18.0),point(2021,18.0),point(2022,null)));
  assertEquals(1,q.getRepeatedRecords());assertEquals(1,q.getUsablePoints());assertEquals(1,q.getMissingValues());assertEquals(2,q.getTrendSeries().size());
 }
 @Test void preservesPrecisionAndZeroRatherThanTreatingThemAsMissing() {
  var precise=point(2021,0.000000123);var q=new ObservationQuality(List.of(precise,point(2022,0.0)));
  assertEquals("0.000000123",precise.getValue());assertEquals(2,q.getUsablePoints());assertEquals(0,q.getConflictTimestamps());
 }
}
