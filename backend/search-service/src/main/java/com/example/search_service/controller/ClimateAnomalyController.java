package com.example.search_service.controller;
import com.example.search_service.service.MetricService;
import java.time.LocalDate;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/metric/anomalies")
public class ClimateAnomalyController {
 private final MetricService metrics;
 @GetMapping public Map<String,Object> analyze(@RequestParam Long assetId,@RequestParam Long metricId,@RequestParam(defaultValue="false") boolean unitConfirmed, @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate fromDate, @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate toDate){
  var h=metrics.getObservationHistory(assetId,metricId,fromDate,toDate);
  if(!unitConfirmed)throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,"Cần đối chiếu và xác nhận đơn vị với nguồn.");
  var name=h.getMetricName().toLowerCase(Locale.ROOT);var unit=h.getUnit();
  boolean supported="Thời tiết".equalsIgnoreCase(h.getCategory()) && ((name.contains("nhiệt")&&"°C".equals(unit))||(name.contains("mưa")&&"mm".equals(unit))||(name.contains("ẩm")&&"%".equals(unit))||(name.contains("nắng")&&"giờ".equals(unit)));
  if(!supported)throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,"Chỉ phân tích chỉ số khí hậu có tên và đơn vị phù hợp; không tự quy đổi nguồn.");
  var points=h.getQuality().getTrendSeries().stream().filter(p->p.getValue()!=null).toList();
  var months=new HashMap<Integer,List<Double>>();var periods=new HashSet<String>();
  for(var p:points){months.computeIfAbsent(p.getTimestamp().getMonthValue(),k->new ArrayList<>()).add(Double.valueOf(p.getValue()));periods.add(p.getTimestamp().toString().substring(0,7));}
  var result=new LinkedHashMap<String,Object>();result.put("method","seasonal_median_MAD");result.put("threshold",3.5);result.put("unit",unit);result.put("usableObservations",points.size());result.put("excludedConflictTimestamps",h.getQuality().getConflictTimestamps());result.put("scope","retrospective_review_only");
  if(points.size()<60||months.size()!=12||months.values().stream().anyMatch(v->v.size()<5)||periods.size()!=points.size()) {result.put("status","insufficient_data");result.put("message","Cần ít nhất 60 quan sát tháng, mỗi tháng trong năm có ít nhất 5 quan sát và không trộn nhiều quan sát trong cùng một tháng.");result.put("candidates",List.of());return result;}
  var candidates=new ArrayList<Map<String,Object>>();
  for(var p:points){double value=Double.parseDouble(p.getValue());var ref=new ArrayList<>(months.get(p.getTimestamp().getMonthValue()));ref.remove(Double.valueOf(value));double median=median(ref);double mad=median(ref.stream().map(v->Math.abs(v-median)).toList());double delta=value-median;Double score=mad==0?null:Math.abs(delta)*0.6744897501960817/mad;
   if((score!=null&&score>3.5)||(mad==0&&delta!=0)){var c=new LinkedHashMap<String,Object>();c.put("recordId",p.getId());c.put("timestamp",p.getTimestamp());c.put("value",value);c.put("referenceMedian",median);c.put("deviation",delta);c.put("score",score);c.put("reason",mad==0?"constant_reference_review_required":"seasonal_deviation");candidates.add(c);}
  }
  result.put("status","completed");result.put("candidates",candidates);result.put("message","Các mốc cần đối chiếu, không phải kết luận nguyên nhân hay dự báo tương lai. Tham chiếu cùng tháng loại chính quan sát đang xét.");return result;
 }
 private static double median(List<Double> values){var v=values.stream().sorted().toList();int n=v.size();return n%2==0?(v.get(n/2-1)+v.get(n/2))/2:v.get(n/2);}
}
