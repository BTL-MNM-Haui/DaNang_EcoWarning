package com.example.search_service.controller;

import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;

@RestController
@RequestMapping("/api/v1/ai/flood")
public class FloodAiController {
 private final RestClient client;
 private static final Set<String> FEATURES=Set.of("X","Y","Slope","Curvature","Aspect","TWI","FA","Drainage","Rainfall");
 public FloodAiController(@Value("${flood.ai.base-url:http://ai-service:8000}") String baseUrl) {
  var factory=new SimpleClientHttpRequestFactory();factory.setConnectTimeout(2000);factory.setReadTimeout(15000);
  client=RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
 }
 @GetMapping("/model") public ResponseEntity<?> model(){return forward("/api/v1/flood/model",null);}
 @PostMapping("/predict") public ResponseEntity<?> predict(@RequestBody Map<String,Object> payload){
  if(!Set.of("point_id","features").containsAll(payload.keySet()) || !(payload.get("features") instanceof Map<?,?> features) || !features.keySet().equals(FEATURES)) return ResponseEntity.unprocessableEntity().body(Map.of("detail","Cần đủ 9 đặc trưng theo hợp đồng mô hình."));
  for(Object v:features.values()) if(v!=null && (!(v instanceof Number n) || !Double.isFinite(n.doubleValue()))) return ResponseEntity.unprocessableEntity().body(Map.of("detail","Đặc trưng phải là số hữu hạn hoặc null."));
  return forward("/api/v1/flood/predict",payload);
 }
 private ResponseEntity<?> forward(String path,Map<String,Object> payload){
  try {Object result=payload==null?client.get().uri(path).retrieve().body(Map.class):client.post().uri(path).contentType(MediaType.APPLICATION_JSON).body(payload).retrieve().body(Map.class);return ResponseEntity.ok(result);}
  catch(RestClientResponseException e){int status=e.getStatusCode().value();return ResponseEntity.status(status==422?422:503).body(Map.of("detail",status==422?"Dữ liệu không đáp ứng hợp đồng mô hình. Kiểm tra point_id và ít nhất một đặc trưng có giá trị.":"Dịch vụ AI chưa sẵn sàng; chưa có kết quả dự đoán."));}
  catch(RestClientException e){return ResponseEntity.status(503).body(Map.of("detail","Không kết nối được AI hoặc hết thời gian chờ; chưa có kết quả dự đoán."));}
 }
}
