import { useResource } from "./useResource";
import { useState } from "react";
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
  const selected = day || days[0];
  const rows =
    forecast.value?.list?.filter(
      (item) =>
        new Date(item.dt * 1000).toLocaleDateString("vi-VN") === selected,
    ) || [];
  return (
    <div className="ec-page">
      <div className="ec-page-heading">
        <div>
          <h1>Thời tiết Đà Nẵng</h1>
          <p>Dữ liệu tham khảo từ OpenWeather tại tọa độ 16.0544, 108.2022.</p>
        </div>
      </div>
      <div className="ec-weather-grid">
        <section className="ec-panel">
          <h2>Ghi nhận hiện tại</h2>
          <Feedback resource={current}>
            {current.value && (
              <>
                <div className="ec-temperature">
                  {Math.round(current.value.main.temp)}
                  <span>°C</span>
                </div>
                <p>{current.value.weather?.[0]?.description}</p>
                <dl className="ec-facts">
                  <div>
                    <dt>Cảm nhận</dt>
                    <dd>{current.value.main.feels_like} °C</dd>
                  </div>
                  <div>
                    <dt>Độ ẩm</dt>
                    <dd>{current.value.main.humidity}%</dd>
                  </div>
                  <div>
                    <dt>Gió</dt>
                    <dd>{current.value.wind.speed} m/s</dd>
                  </div>
                </dl>
                <p className="ec-source">
                  Quan sát: {displayTime(current.value.dt * 1000)}
                </p>
              </>
            )}
          </Feedback>
        </section>
        <section className="ec-panel">
          <h2>Chất lượng không khí</h2>
          <Feedback resource={air}>
            {air.value?.list?.[0] && (
              <>
                <div className="ec-air-quality">
                  {["", "Tốt", "Khá", "Trung bình", "Kém", "Rất kém"][
                    air.value.list[0].main.aqi
                  ] || "Chưa rõ"}
                </div>
                <p>Chỉ số OpenWeather: {air.value.list[0].main.aqi}/5</p>
                <dl className="ec-facts">
                  <div>
                    <dt>PM2.5</dt>
                    <dd>{air.value.list[0].components.pm2_5} µg/m³</dd>
                  </div>
                  <div>
                    <dt>PM10</dt>
                    <dd>{air.value.list[0].components.pm10} µg/m³</dd>
                  </div>
                </dl>
                <p className="ec-source">
                  Quan sát: {displayTime(air.value.list[0].dt * 1000)}
                </p>
              </>
            )}
          </Feedback>
        </section>
      </div>
      <section className="ec-panel">
        <div className="ec-section-heading">
          <h2>Dự báo theo giờ</h2>
          <label>
            Ngày
            <select
              value={selected || ""}
              onChange={(e) => setDay(e.target.value)}
            >
              {days.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <Feedback resource={forecast} empty={!rows.length}>
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
                    <td className="ec-numeric">{item.rain?.["3h"] ?? 0} mm</td>
                    <td className="ec-numeric">{item.wind.speed} m/s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Feedback>
        <p className="ec-source">
          Dự báo bên ngoài không xác nhận tình trạng ngập tại một tuyến đường.
        </p>
      </section>
    </div>
  );
}
