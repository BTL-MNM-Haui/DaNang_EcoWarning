import React from "react";
import {
  WiSunset,
  WiSunrise,
  WiHumidity,
  WiBarometer,
  WiStrongWind,
  WiThermometer,
  WiThermometerExterior,
  WiRain,
  WiCloudy,
} from "react-icons/wi";
import "../../styles/components/_weather-components.scss";

const formatTime = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getWeatherIcon = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

const CurrentWeatherCard = ({ data, isForecastDay }) => {
  if (!data) return null;

  return (
    <div className="current-weather-card">
      <div className="main-info">
        <div className="location-info">
          {/* <h2>{data.name}</h2> */}
          <h2 style={{ marginBottom: "10px" }}>Đà Nẵng</h2>
          <p>
            {new Date(data.dt * 1000).toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="temp-info">
          {data.weather && data.weather[0] && (
            <img
              className="weather-icon"
              src={getWeatherIcon(data.weather[0].icon)}
              alt={data.weather[0].description}
            />
          )}
          <span className="temp">{Math.round(data.main.temp)}°C</span>
          {data.weather && data.weather[0] && (
            <span className="description">{data.weather[0].description}</span>
          )}
        </div>
        {/* <div className="temp-range">
          <span className="range-label">{minTemp}°</span>
          <div className="range-bar-container">
            <div className="range-bar-track"></div>
            <div className="range-bar-segment"></div>
            <div
              className="range-bar-current"
              style={{ left: `${cappedPosition}%` }}
            ></div>
          </div>
          <span className="range-label">{maxTemp}°</span>
        </div> */}
      </div>

      <div className="details-grid">
        <div className="detail-item">
          <WiStrongWind size={30} />
          <span>Gió</span>
          <strong>{data.wind.speed} m/s</strong>
        </div>
        <div className="detail-item">
          <WiHumidity size={30} />
          <span>Độ ẩm</span>
          <strong>{data.main.humidity}%</strong>
        </div>
        {/* <div className="detail-item">
          <WiBarometer size={30} />
          <span>Áp suất</span>
          <strong>{data.main.pressure} hPa</strong>
        </div> */}
        <div className="detail-item">
          <WiThermometer size={30} />
          <span>Cảm giác</span>
          <strong>{Math.round(data.main.feels_like)}°C</strong>
        </div>
        {data.clouds && typeof data.clouds.all !== "undefined" && (
          <div className="detail-item">
            <WiCloudy size={30} />
            <span>Mây che phủ</span>
            <strong>{data.clouds.all}%</strong>
          </div>
        )}

        {/* <div className="detail-item">
          <WiThermometer size={30} />
          <span>Cao nhất</span>
          <strong>{Math.round(data.main.temp_max)}°C</strong>
        </div>

        <div className="detail-item">
          <WiThermometerExterior size={30} />
          <span>Thấp nhất</span>
          <strong>{Math.round(data.main.temp_min)}°C</strong>
        </div> */}
        {/* {data.main.sea_level && (
          <div className="detail-item">
            <WiBarometer size={30} />
            <span>Áp suất (Biển)</span>
            <strong>{data.main.sea_level} hPa</strong>
          </div>
        )} */}

        {/* {data.main.grnd_level && (
          <div className="detail-item">
            <WiBarometer size={30} />
            <span>Áp suất (Đất)</span>
            <strong>{data.main.grnd_level} hPa</strong>
          </div>
        )} */}

        {!isForecastDay && data.sys && (
          <>
            <div className="detail-item">
              <WiSunrise size={30} />
              <span>Mặt trời mọc</span>
              <strong>{formatTime(data.sys.sunrise)}</strong>
            </div>
            <div className="detail-item">
              <WiSunset size={30} />
              <span>Mặt trời lặn</span>
              <strong>{formatTime(data.sys.sunset)}</strong>
            </div>
          </>
        )}

        {!isForecastDay && data.rain && data.rain["1h"] !== undefined && (
          <div className="detail-item">
            <WiRain size={30} />
            <span>Lượng mưa (1h)</span>
            <strong>{data.rain["1h"]} mm</strong>
          </div>
        )}
        {data.rain && data.rain["3h"] !== undefined && (
          <div className="detail-item">
            <WiRain size={30} />
            <span>Lượng mưa (3h)</span>
            <strong>{data.rain["3h"]} mm</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentWeatherCard;
