package com.example.search_service.controller;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class FloodAiControllerTests {
 @Test void preservesPredictionAndRejectsInvalidFeatureSets() throws Exception {
  var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/api/v1/flood/predict",e->{byte[] b="{\"prediction\":1,\"label\":\"Flood\",\"flood_probability\":0.8}".getBytes(StandardCharsets.UTF_8);e.getResponseHeaders().add("Content-Type","application/json");e.sendResponseHeaders(200,b.length);e.getResponseBody().write(b);e.close();});server.start();
  try {var c=new FloodAiController("http://127.0.0.1:"+server.getAddress().getPort());var f=new HashMap<String,Object>();for(String key:List.of("X","Y","Slope","Curvature","Aspect","TWI","FA","Drainage","Rainfall"))f.put(key,1.0);var r=c.predict(Map.of("features",f));assertEquals(200,r.getStatusCode().value());assertEquals("Flood",((Map<?,?>)r.getBody()).get("label"));assertEquals(422,c.predict(Map.of("features",Map.of("X",1))).getStatusCode().value());}finally{server.stop(0);}
 }
 @Test void unavailabilityNeverBecomesNoFlood(){var c=new FloodAiController("http://127.0.0.1:1");assertEquals(503,c.model().getStatusCode().value());}
 @Test void evaluationPreservesProvenanceAndProxiesOnlyKnownImages() throws Exception {
  var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/api/v1/flood/evaluation",e->{
   byte[] b=e.getRequestURI().getPath().endsWith("gini")?new byte[]{(byte)0x89,0x50,0x4e,0x47,13,10,26,10}:"{\"model_version\":\"sha256:test\",\"notebook_report\":{\"model_binding\":\"not_verified\"}}".getBytes(StandardCharsets.UTF_8);
   e.getResponseHeaders().add("Content-Type",e.getRequestURI().getPath().endsWith("gini")?"image/png":"application/json");e.sendResponseHeaders(200,b.length);e.getResponseBody().write(b);e.close();
  });server.start();
  try {var c=new FloodAiController("http://127.0.0.1:"+server.getAddress().getPort());assertEquals(200,c.evaluation().getStatusCode().value());assertEquals("sha256:test",((Map<?,?>)c.evaluation().getBody()).get("model_version"));assertEquals(200,c.chart("gini").getStatusCode().value());assertEquals("image/png",c.chart("gini").getHeaders().getContentType().toString());assertEquals(503,c.chart("shap").getStatusCode().value());assertEquals(404,c.chart("unknown").getStatusCode().value());}finally{server.stop(0);}
 }
}
