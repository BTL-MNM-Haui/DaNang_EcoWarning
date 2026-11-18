package com.example.search_service.controller;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.example.search_service.service.MetricService;
import com.example.search_service.domain.entity.*;
import com.example.search_service.domain.dto.response.*;
import java.util.*;
import java.time.LocalDateTime;
class ClimateAnomalyControllerTests {
 @Test void respectsConflictsAndFindsSeasonalReviewCandidates(){
  var service=mock(MetricService.class);var asset=new Asset();asset.setName("Fixture");var metric=new Metric();metric.setName("Nhiệt độ");metric.setUnit("°C");metric.setCategory("Thời tiết");var points=new ArrayList<TimeSeriesDataPoint>();
  for(int y=2010;y<2016;y++)for(int m=1;m<=12;m++){var o=new Observation();o.setId((long)points.size());o.setRecordTime(LocalDateTime.of(y,m,1,0,0));o.setValue(y==2015&&m==6?100.0:20.0+(y%3));points.add(new TimeSeriesDataPoint(o));}
  when(service.getObservationHistory(1L,2L,null,null)).thenReturn(new ObservationHistoryDTO(asset,metric,points));var controller=new ClimateAnomalyController(service);var r=controller.analyze(1L,2L,true,null,null);assertEquals("completed",r.get("status"));assertFalse(((List<?>)r.get("candidates")).isEmpty());assertThrows(org.springframework.web.server.ResponseStatusException.class,()->controller.analyze(1L,2L,false,null,null));
 }
 @Test void doesNotInventResultsForShortSeries(){var service=mock(MetricService.class);var a=new Asset();var m=new Metric();m.setName("Nhiệt độ");m.setUnit("°C");m.setCategory("Thời tiết");when(service.getObservationHistory(1L,2L,null,null)).thenReturn(new ObservationHistoryDTO(a,m,List.of()));assertEquals("insufficient_data",new ClimateAnomalyController(service).analyze(1L,2L,true,null,null).get("status"));}
}
