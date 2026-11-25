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
}
