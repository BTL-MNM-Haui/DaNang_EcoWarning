import React, { useState, useEffect } from "react";
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
import { getMetricHistory } from "../../services/api";
import "../../styles/components/_modal.scss";

const COLORS = ["#ef4444"];

const DamageDetailModal = ({ isOpen, onClose, metric, assetId }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unit, setUnit] = useState("");

  useEffect(() => {
    if (!isOpen || !metric || !metric.id) {
      setChartData([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getMetricHistory(assetId, metric.id);

        const formattedData = data.timeSeries
          .map((item) => ({
            year: new Date(item.timestamp).getFullYear(),
            value: parseFloat(item.value),
          }))
          .sort((a, b) => a.year - b.year);

        setChartData(formattedData);
        setUnit(data.unit);
      } catch (error) {

      }
      setIsLoading(false);
    };

    fetchData();
  }, [isOpen, metric, assetId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {}
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">
          &times;
        </button>

        <h3>Lịch sử: {metric.name}</h3>
        <p className="chart-subtitle" style={{ marginTop: "10px" }}>
          Dữ liệu lịch sử qua các năm
        </p>

        <div className="modal-chart-container">
          {isLoading ? (
            <p>Đang tải dữ liệu biểu đồ...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `${value.toLocaleString()} ${unit}`,
                    metric.name,
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={metric.name}
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        {}
      </div>
    </div>
  );
};

export default DamageDetailModal;
