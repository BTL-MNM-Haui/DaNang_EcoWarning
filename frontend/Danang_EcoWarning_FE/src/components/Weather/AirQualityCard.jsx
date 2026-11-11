import React from "react";
import "../../styles/components/_weather-components.scss";

const getAqiInfo = (aqi) => {
  switch (aqi) {
    case 1:
      return { text: "Tốt", color: "#10b981" };
    case 2:
      return { text: "Trung bình", color: "#f59e0b" };
    case 3:
      return { text: "Vừa phải", color: "#f97316" };
    case 4:
      return { text: "Kém", color: "#ef4444" };
    case 5:
      return { text: "Rất kém", color: "#dc2626" };
    default:
      return { text: "Không rõ", color: "#6b7280" };
  }
};

const AirQualityCard = ({ data }) => {
  if (!data) return null;

  const aqiInfo = getAqiInfo(data.main.aqi);
  const components = data.components;

  return (
    <div className="aqi-card chart-container">
      <h4>Chất lượng Không khí hôm nay (AQI)</h4>
      <div className="aqi-main">
        <span className="aqi-value" style={{ color: aqiInfo.color }}>
          {data.main.aqi}
        </span>
        <span className="aqi-text" style={{ backgroundColor: aqiInfo.color }}>
          {aqiInfo.text}
        </span>
      </div>
      <p className="api-titles">Nồng độ các chất ( &mu;g/m&sup3; ):</p>
      <div className="aqi-details-grid">
        <div className="aqi-detail-item">
          <span>PM2.5</span>
          <strong>{components.pm2_5.toFixed(2)}</strong>
        </div>
        <div className="aqi-detail-item">
          <span>PM10</span>
          <strong>{components.pm10.toFixed(2)}</strong>
        </div>
        <div className="aqi-detail-item">
          <span>O3</span>
          <strong>{components.o3.toFixed(2)}</strong>
        </div>
        <div className="aqi-detail-item">
          <span>NO2</span>
          <strong>{components.no2.toFixed(2)}</strong>
        </div>
        <div className="aqi-detail-item">
          <span>SO2</span>
          <strong>{components.so2.toFixed(2)}</strong>
        </div>
        <div className="aqi-detail-item">
          <span>CO</span>
          <strong>{components.co.toFixed(2)}</strong>
        </div>
        <div className="aqi-detail-item">
          <span>NO</span>
          <strong>{components.no.toFixed(2)}</strong>
        </div>
        <div className="aqi-detail-item">
          <span>NH3</span>
          <strong>{components.nh3.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
};

export default AirQualityCard;
