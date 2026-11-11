import React, { useState, useEffect } from "react";
import {
  getCurrentWeather,
  getForecastWeather,
  getAirPollution,
} from "../../services/api";
import "../../styles/pages/_weather-page.scss";
import CurrentWeatherCard from "../../components/Weather/CurrentWeatherCard";
import ForecastPanel from "../../components/Weather/ForecastPanel";
import WeatherCharts from "../../components/Weather/WeatherCharts";
import AirQualityCard from "../../components/Weather/AirQualityCard";

const DEFAULT_LAT = 16.0544;
const DEFAULT_LON = 108.2208;

const WeatherPage = () => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [airPollution, setAirPollution] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchAllData = async (lat, lon) => {
      setIsLoading(true);
      try {
        const [currentData, forecastData, airData] = await Promise.all([
          getCurrentWeather(lat, lon),
          getForecastWeather(lat, lon),
          getAirPollution(lat, lon),
        ]);

        setCurrentWeather(currentData);
        setForecast(forecastData);
        setAirPollution(airData);
      } catch (error) {
        console.error("Lỗi khi tải toàn bộ dữ liệu thời tiết:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData(DEFAULT_LAT, DEFAULT_LON);
  }, []);

  if (isLoading) {
    return (
      <div className="weather-page">
        {" "}
        <div className="weather-loading">Đang tải dữ liệu thời tiết...</div>
      </div>
    );
  }

  if (!currentWeather || !forecast || !airPollution) {
    return (
      <div className="weather-page">
        <div className="weather-loading">
          Không thể tải dữ liệu. Vui lòng thử lại.
        </div>
      </div>
    );
  }
  const chartData = selectedDay || forecast.list.slice(0, 8);
  const chartTitle = selectedDay
    ? `Chi tiết ngày ${new Date(selectedDay[0].dt * 1000).toLocaleDateString(
        "vi-VN"
      )}`
    : "Dự báo 24 giờ tới";
  let displayData;

  if (selectedDay) {
    const representativeData = selectedDay[0];
    displayData = {
      ...representativeData,
      name: forecast.city.name,
      sys: currentWeather.sys,
    };
  } else {
    displayData = currentWeather;
  }

  return (
    <div className="weather-page">
      <div className="weather-content-container">
        <h1 className="weather-page-title">Da Nang Weather Forecast </h1>
        <CurrentWeatherCard data={displayData} isForecastDay={!!selectedDay} />
        <ForecastPanel
          forecastList={forecast.list}
          onDaySelect={setSelectedDay}
          selectedDayDt={selectedDay ? selectedDay[0].dt : null}
        />
        <div className="weather-grid">
          <div className="main-charts">
            <WeatherCharts
              key={selectedDay ? selectedDay[0].dt : "initial"}
              data={chartData}
              title={chartTitle}
            />
          </div>
          <div className="side-panel">
            <AirQualityCard data={airPollution} />
          </div>
        </div>
      </div>{" "}
    </div>
  );
};

export default WeatherPage;
