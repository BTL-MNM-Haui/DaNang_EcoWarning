import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getMetricsByAsset, getMetricHistory } from "../../services/api";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e"];
const DEFAULT_ASSET_ID = 1823;

const TEMP_METRIC_NAME = "Nhiệt độ không khí trung bình";
const RAIN_METRIC_NAME = "Lượng mưa";
const SUN_METRIC_NAME = "Số giờ nắng";
const CATEGORY_TO_BLOCK = "Thiệt hại thiên tai";

const AgricultureChart = () => {
  const [fullMetricsList, setFullMetricsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [metricsForCategory, setMetricsForCategory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMetricId, setSelectedMetricId] = useState("");
  const [chartData, setChartData] = useState([]);
  const [chartInfo, setChartInfo] = useState({
    name: "",
    unit: "",
    isMonthly: false,
    displayType: "line",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const metrics = await getMetricsByAsset(DEFAULT_ASSET_ID);
        setFullMetricsList(metrics);
        const uniqueCategories = [...new Set(metrics.map((m) => m.category))]
          .filter((category) => category !== CATEGORY_TO_BLOCK)
          .sort();
        setCategories(uniqueCategories);
        if (uniqueCategories.length > 0) {
          const defaultCategory = uniqueCategories.includes("Nông nghiệp")
            ? "Nông nghiệp"
            : uniqueCategories[0];
          setSelectedCategory(defaultCategory);
        }
      } catch (error) {}
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!selectedCategory || fullMetricsList.length === 0) {
      setMetricsForCategory([]);
      return;
    }
    const prefixToBlock = "Sản lượng - ";
    const metrics = fullMetricsList
      .filter((m) => m.category === selectedCategory)
      .filter((m) => !m.name.startsWith(prefixToBlock))
      .sort((a, b) => a.name.localeCompare(b.name));
    setMetricsForCategory(metrics);
    if (metrics.length > 0) {
      setSelectedMetricId(metrics[0].id);
    } else {
      setSelectedMetricId("");
      setChartData([]);
      setChartInfo({
        name: "",
        unit: "",
        isMonthly: false,
        displayType: "empty",
      });
    }
  }, [selectedCategory, fullMetricsList]);

  useEffect(() => {
    if (!selectedMetricId) {
      setIsLoading(false);
      setChartData([]);
      setChartInfo({
        name: "Vui lòng chọn số liệu",
        unit: "",
        isMonthly: false,
        displayType: "empty",
      });
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getMetricHistory(DEFAULT_ASSET_ID, selectedMetricId);
        const isFaultyTempMetric = data.metricName === TEMP_METRIC_NAME;
        const isRainMetric = data.metricName === RAIN_METRIC_NAME;
        const isSunMetric = data.metricName === SUN_METRIC_NAME;
        const formattedData = data.timeSeries
          .map((item) => {
            const dateObj = new Date(item.timestamp);
            const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
            const year = dateObj.getFullYear();
            let rawValue = parseFloat(item.value);
            if (isFaultyTempMetric) rawValue /= 1;
            if (isRainMetric) rawValue /= 100;
            if (isSunMetric) rawValue /= 10;
            return {
              value: rawValue,
              timeLabel: `${month}/${year}`,
              fullDate: dateObj,
            };
          })
          .sort((a, b) => a.fullDate - b.fullDate);

        const years = formattedData.map((item) => item.fullDate.getFullYear());
        const uniqueYears = [...new Set(years)];
        const isMonthly = uniqueYears.length < formattedData.length;
        let newDisplayType = "line";
        if (formattedData.length === 1) {
          newDisplayType = "stat";
        } else if (formattedData.length === 0) {
          newDisplayType = "empty";
        }

        setChartData(formattedData);
        setChartInfo({
          name: data.metricName,
          unit: data.unit,
          isMonthly: isMonthly,
          displayType: newDisplayType,
        });
      } catch (error) {
        setChartData([]);
        setChartInfo({
          name: "Lỗi tải dữ liệu",
          unit: "",
          isMonthly: false,
          displayType: "empty",
        });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [selectedMetricId]);

  const formatTooltipValue = (value) => {
    if (chartInfo.name === TEMP_METRIC_NAME) return value.toFixed(1);
    if (chartInfo.name === RAIN_METRIC_NAME) return value.toFixed(2);
    if (chartInfo.name === SUN_METRIC_NAME) return value.toFixed(2);
    if (Number.isInteger(value)) return value;
    return value.toFixed(2);
  };
  const ChartPlaceholder = ({ message }) => (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#666",
        fontSize: "0.9rem",
      }}
    >
      <p>{message}</p>
    </div>
  );
  const CustomTooltip = (
    <Tooltip
      isAnimationActive={false}
      formatter={(value) => [
        `${formatTooltipValue(parseFloat(value))} ${chartInfo.unit}`,
        chartInfo.name,
      ]}
      wrapperStyle={{
        zIndex: 10,
        backgroundColor: "#f0f0f0",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        outline: "none",
      }}
    />
  );

  const renderChart = () => {
    switch (chartInfo.displayType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="timeLabel"
                tickFormatter={(timeLabel) => {
                  if (chartInfo.isMonthly) {
                    if (timeLabel.startsWith("01/"))
                      return timeLabel.split("/")[1];
                    return "";
                  }
                  return timeLabel.split("/")[1];
                }}
                interval={chartInfo.isMonthly ? 11 : 0}
              />
              <YAxis />
              {CustomTooltip}
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name={chartInfo.name}
                stroke={COLORS[0]}
                strokeWidth={2}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "stat":
        const statValue = chartData[0].value;
        const statYear = chartData[0].timeLabel.split("/")[1];

        return (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "20px",
              color: "#333",
            }}
          >
            {/* <div
              style={{
                fontSize: "1.2rem",
                color: "#555",
                marginBottom: "15px",
              }}
            >
              Năm {statYear}
            </div> */}

            {}
            <div
              style={{ fontSize: "4rem", fontWeight: "700", color: COLORS[0] }}
            >
              {formatTooltipValue(statValue)}
              {chartInfo.unit}
            </div>

            {}
            {/* <div
              style={{ fontSize: "1.5rem", color: "#666", marginTop: "5px" }}
            >
              {chartInfo.unit}
            </div> */}
          </div>
        );

      case "empty":
      default:
        return <ChartPlaceholder message="Không có dữ liệu cho số liệu này." />;
    }
  };

  return (
    <>
      <div className="chart-filters-container">
        <div className="filter-group">
          <label htmlFor="category-select">Danh mục:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isLoading}
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="metric-select">Số liệu:</label>
          <select
            id="metric-select"
            value={selectedMetricId}
            onChange={(e) => setSelectedMetricId(e.target.value)}
            disabled={isLoading || metricsForCategory.length === 0}
          >
            <option value="">-- Chọn số liệu --</option>
            {metricsForCategory.map((metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h3
        style={{
          paddingLeft: "10px",
          marginTop: "10px",
          marginBottom: "20px",
        }}
      >
        {chartInfo.name}
        {chartInfo.displayType !== "stat" &&
          chartInfo.unit &&
          ` (${chartInfo.unit})`}
      </h3>
      <div style={{ height: "250px", width: "100%" }}>
        {isLoading ? (
          <ChartPlaceholder message="Đang tải dữ liệu biểu đồ..." />
        ) : (
          renderChart()
        )}
      </div>
    </>
  );
};

export default AgricultureChart;
