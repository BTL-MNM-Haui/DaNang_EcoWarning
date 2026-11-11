import React, { useRef, useEffect } from "react";
import goongSdk from "@goongmaps/goong-js";
import "../../styles/components/_location-picker-map.scss";

const LocationPickerMap = ({
  apiKey,
  initialLat,
  initialLng,
  onLocationChange,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!apiKey) {
      console.error("Goong Maps API Key bị thiếu!");
      return;
    }
    goongSdk.accessToken = apiKey;

    if (map.current || !mapContainer.current) return;

    map.current = new goongSdk.Map({
      container: mapContainer.current,
      style: "https://tiles.goong.io/assets/goong_map_web.json",
      center: [initialLng, initialLat],
      zoom: 13,
    });

    map.current.addControl(new goongSdk.NavigationControl());

    marker.current = new goongSdk.Marker({
      draggable: true,
      color: "#E74C3C",
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    const onDragEnd = () => {
      const lngLat = marker.current.getLngLat();
      if (onLocationChangeRef.current) {
        onLocationChangeRef.current({ lat: lngLat.lat, lng: lngLat.lng });
      }
    };

    const onMapClick = (e) => {
      const lngLat = e.lngLat;
      marker.current.setLngLat(lngLat);
      if (onLocationChangeRef.current) {
        onLocationChangeRef.current({ lat: lngLat.lat, lng: lngLat.lng });
      }
    };

    marker.current.on("dragend", onDragEnd);
    map.current.on("click", onMapClick);

    return () => {
      if (marker.current) {
        marker.current.off("dragend", onDragEnd);
      }
      if (map.current) {
        map.current.off("click", onMapClick);
        map.current.remove();
      }
      map.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!map.current || !marker.current) return;

    const currentMarkerLngLat = marker.current.getLngLat();
    const currentLat = parseFloat(currentMarkerLngLat.lat.toFixed(6));
    const currentLng = parseFloat(currentMarkerLngLat.lng.toFixed(6));

    const propLat = parseFloat(initialLat.toFixed(6));
    const propLng = parseFloat(initialLng.toFixed(6));
    if (currentLat !== propLat || currentLng !== propLng) {
      marker.current.setLngLat([initialLng, initialLat]);

      map.current.flyTo({
        center: [initialLng, initialLat],
      });
    }
  }, [initialLat, initialLng]);

  return <div ref={mapContainer} className="location-picker-map" />;
};

export default LocationPickerMap;
