import { useResource } from "./useResource";
import { useState, createElement } from "react";
import { Link } from "react-router-dom";
import {
  FiSun,
  FiMoon,
  FiCloud,
  FiCloudRain,
  FiCloudSnow,
  FiWind,
  FiDroplet,
  FiArrowUpRight,
} from "react-icons/fi";
import axios from "axios";
import { Feedback } from "./shared";
import { displayTime } from "./api";

const weather = async (path) => {
  const base = import.meta.env.VITE_OPENWEATHER_BASE_URL,
    key = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!base || !key) throw new Error("missing configuration");
  return axios
    .get(`${base.replace(/\/$/, "")}/${path}`, {
      params: {
        lat: 16.0544,
        lon: 108.2022,
        appid: key,
        units: "metric",
        lang: "vi",
      },
      timeout: 15000,
    })
    .then((r) => r.data);
};
function WeatherSymbol({ condition }) {
  const id = condition?.id,
    icon =
      id >= 200 && id < 600
        ? FiCloudRain
        : id >= 600 && id < 700
          ? FiCloudSnow
          : id === 800
            ? condition?.icon?.endsWith("n")
              ? FiMoon
              : FiSun
            : FiCloud;
  return createElement(icon, { "aria-hidden": true });
}
const airLabels = ["", "Tốt", "Khá", "Trung bình", "Kém", "Rất kém"];
export default function Weather() {
  const current = useResource(() => weather("weather")),
    forecast = useResource(() => weather("forecast")),
    air = useResource(() => weather("air_pollution"));
  const [day, setDay] = useState("");
  const days = [
    ...new Set(
      (forecast.value?.list || []).map((item) =>
        new Date(item.dt * 1000).toLocaleDateString("vi-VN"),
      ),
    ),
  ];
  const selected = days.includes(day) ? day : days[0];
  const rows = (forecast.value?.list || []).filter(
    (item) => new Date(item.dt * 1000).toLocaleDateString("vi-VN") === selected,
  );
  const observation = current.value,
    airData = air.value?.list?.[0];
  return (
    <div className="ec-page ec-weather-page">
      <div className="ec-page-heading">
        <div>
          <h1>Thời tiết & không khí</h1>
          <p>Góc nhìn thời tiết tại Đà Nẵng, trước khi bạn ra ngoài.</p>
        </div>
        <Link className="ec-button ec-secondary" to="/">
          Xem bản đồ sự cố <FiArrowUpRight aria-hidden="true" />
        </Link>
      </div>
      <div className="ec-weather-overview">
        <section className="ec-current-weather">
          <h2>Thời tiết hiện tại</h2>
          <Feedback resource={current}>
            {observation && (
              <>
                <div className="ec-weather-reading">
                  <div>
                    <div className="ec-temperature">
                      {Math.round(observation.main.temp)}
                      <span>°C</span>
                    </div>
                    <p>{observation.weather?.[0]?.description}</p>
                  </div>
                  <div className="ec-weather-symbol">
                    <WeatherSymbol condition={observation.weather?.[0]} />
                  </div>
                </div>
                <dl className="ec-weather-measures">
                  <div>
                    <dt>
                      <FiSun aria-hidden="true" />
                      Cảm nhận
                    </dt>
                    <dd>
                      {observation.main.feels_like} <span>°C</span>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <FiDroplet aria-hidden="true" />
                      Độ ẩm
                    </dt>
                    <dd>
                      {observation.main.humidity}
                      <span>%</span>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <FiWind aria-hidden="true" />
                      Gió
                    </dt>
                    <dd>
                      {observation.wind.speed} <span>m/s</span>
                    </dd>
                  </div>
                </dl>
                <p className="ec-source">
                  Quan sát: {displayTime(observation.dt * 1000)}
                </p>
              </>
            )}
          </Feedback>
        </section>
        <section className="ec-air-panel">
          <h2>Chất lượng không khí</h2>
          <Feedback resource={air}>
            {airData && (
              <>
                <div
                  className={`ec-air-reading ec-air-level-${airData.main.aqi}`}
                >
                  <span className="ec-air-dot" />
                  {airLabels[airData.main.aqi] || "Chưa rõ"}
                </div>
                <p className="ec-muted">
                  Thang OpenWeather · {airData.main.aqi}/5
                </p>
                <dl className="ec-air-measures">
                  <div>
                    <dt>PM2.5</dt>
                    <dd>
                      {airData.components.pm2_5}
                      <small>µg/m³</small>
                    </dd>
                  </div>
                  <div>
                    <dt>PM10</dt>
                    <dd>
                      {airData.components.pm10}
                      <small>µg/m³</small>
                    </dd>
                  </div>
                </dl>
                <p className="ec-source">
                  Quan sát: {displayTime(airData.dt * 1000)}
                </p>
              </>
            )}
          </Feedback>
        </section>
      </div>
      <section className="ec-panel ec-forecast-panel">
        <div className="ec-section-heading">
          <div>
            <h2>Dự báo trong ngày</h2>
            <p className="ec-muted">Các mốc dự báo cách nhau 3 giờ.</p>
          </div>
          <label>
            Chọn ngày
            <select
              value={selected || ""}
              disabled={!days.length}
              onChange={(e) => setDay(e.target.value)}
            >
              {days.length ? (
                days.map((value) => <option key={value}>{value}</option>)
              ) : (
                <option value="">Đang tải…</option>
              )}
            </select>
          </label>
        </div>
        <Feedback resource={forecast} empty={!rows.length}>
          <div
            className="ec-hourly-strip"
            role="region"
            aria-label="Dự báo mỗi ba giờ"
            tabIndex={0}
          >
            {rows.map((item) => (
              <article key={item.dt} className="ec-forecast-hour">
                <time dateTime={new Date(item.dt * 1000).toISOString()}>
                  {new Date(item.dt * 1000).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
                <WeatherSymbol condition={item.weather?.[0]} />
                <strong>
                  {Math.round(item.main.temp)}
                  <span>°C</span>
                </strong>
                <p>{item.weather?.[0]?.description}</p>
                <span className="ec-rain-chance">
                  <FiDroplet aria-hidden="true" />
                  {Math.round(item.pop * 100)}% mưa
                </span>
                <small>{item.rain?.["3h"] ?? 0} mm / 3 giờ</small>
              </article>
            ))}
          </div>
          <details className="ec-forecast-table">
            <summary>Xem bảng dự báo chi tiết</summary>
            <div className="ec-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Thời điểm</th>
                    <th>Điều kiện</th>
                    <th className="ec-numeric">Nhiệt độ</th>
                    <th className="ec-numeric">Khả năng mưa</th>
                    <th className="ec-numeric">Mưa / 3 giờ</th>
                    <th className="ec-numeric">Gió</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.dt}>
                      <td>{displayTime(item.dt * 1000)}</td>
                      <td>{item.weather?.[0]?.description}</td>
                      <td className="ec-numeric">{item.main.temp} °C</td>
                      <td className="ec-numeric">
                        {Math.round(item.pop * 100)}%
                      </td>
                      <td className="ec-numeric">
                        {item.rain?.["3h"] ?? 0} mm
                      </td>
                      <td className="ec-numeric">{item.wind.speed} m/s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Feedback>
      </section>
      <p className="ec-weather-attribution">
        Nguồn: OpenWeather · Tọa độ tham khảo: 16.0544, 108.2022. Dự báo thời
        tiết không xác nhận tình trạng ngập tại từng tuyến đường.
      </p>
    </div>
  );
}
