import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
} from "recharts";
import "../../styles/components/_weather-components.scss";
const formatTime = (dt) =>
  new Date(dt * 1000).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const WeatherCharts = ({ data, title }) => {
  if (!data || data.length === 0) return null;
  const chartData = data.map((item) => ({
    time: formatTime(item.dt),
    "Nhiệt độ": Math.round(item.main.temp),
    "Khả năng mưa": parseFloat((item.pop * 100).toFixed(0)),
    "Lượng mưa (mm)": item.rain ? item.rain["3h"] : 0,
    "Tốc độ gió (m/s)": item.wind.speed,
  }));

  return (
    <>
      <div className="chart-container" style={{ height: "300px" }}>
        <h3>{title}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="time" />
            <YAxis
              yAxisId="left"
              label={{ value: "°C", angle: -90, position: "insideLeft" }}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: "%", angle: 90, position: "insideRight" }}
              domain={[0, 100]}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="Khả năng mưa"
              barSize={30}
              fill="#ffaa00ff"
              yAxisId="right"
              name="Khả năng mưa (%)"
            />
            <Line
              type="monotone"
              dataKey="Nhiệt độ"
              stroke="#00be46ff"
              strokeWidth={2}
              yAxisId="left"
              name="Nhiệt độ (°C)"
              dot={false}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div
        className="chart-container"
        style={{ height: "300px", marginTop: "4px" }}
      >
        <h3>Lượng mưa dự kiến</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="time" />
            <YAxis
              label={{ value: "mm", angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="Lượng mưa (mm)"
              fill="#1781f9ff"
              name="Lượng mưa (mm)"
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default WeatherCharts;
