
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getDisasterDamageByYear } from "../../services/api";

const DamageChart = ({ onBarClick }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getDisasterDamageByYear();
        const chartData = result.map((item) => ({
          name: item.year,
          "Tổng thiệt hại (tỷ đồng)": item.totalValue,
        }));
        setData(chartData);
      } catch (error) {

      }
    };
    fetchData();
  }, []);

  const handleChartClick = (chartData) => {

    if (chartData && chartData.activeLabel) {
      const year = chartData.activeLabel; 

      if (year) {
        onBarClick(year); 
      }
    }
  };
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        onClick={handleChartClick}
        cursor="pointer"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Tổng thiệt hại (tỷ đồng)" fill="#ef4444" barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DamageChart;
