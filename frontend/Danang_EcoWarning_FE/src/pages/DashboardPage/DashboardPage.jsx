import React, { useState, useEffect } from "react";
import AssetTypeChart from "../../components/dashboard/AssetTypeChart";
import DamageChart from "../../components/dashboard/DamageChart";
import AgricultureChart from "../../components/dashboard/AgricultureChart";

import DamageDetailPanel, {
  DamageDetailPlaceholder,
} from "../../components/dashboard/DamageDetailPanel";
import DamageDetailModal from "../../components/dashboard/DamageDetailModal";
import { getDamageDetail, getMetricsByAsset } from "../../services/api";

import "../../styles/pages/_dashboard-page.scss";

const aggregateDamageData = (allYearsData) => {
  const totalMap = new Map();

  for (const yearData of allYearsData) {
    if (!yearData) continue;

    for (const item of yearData) {
      const key = `${item.metricName}-${item.unit}`;

      const numericValue = Number(item.value) || 0;

      if (totalMap.has(key)) {
        totalMap.get(key).value += numericValue;
      } else {
        totalMap.set(key, {
          metricName: item.metricName,
          unit: item.unit,
          value: numericValue,
        });
      }
    }
  }
  return Array.from(totalMap.values());
};
const DashboardPage = () => {
  const [damageDetailData, setDamageDetailData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [totalDamageData, setTotalDamageData] = useState(null);
  const [damageMetricMap, setDamageMetricMap] = useState(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMetric, setModalMetric] = useState(null);

  const YEARS_TO_FETCH = [2020, 2021, 2022];
  const DEFAULT_ASSET_ID = 1823;
  const DAMAGE_CATEGORY = "Thiệt hại thiên tai";
  useEffect(() => {
    const fetchDamageMetricMap = async () => {
      try {
        const allMetrics = await getMetricsByAsset(DEFAULT_ASSET_ID);
        const damageMetrics = allMetrics.filter(
          (m) => m.category === DAMAGE_CATEGORY
        );

        const newMap = new Map(damageMetrics.map((m) => [m.name, m.id]));
        setDamageMetricMap(newMap);
      } catch (error) {
        console.error("Lỗi khi tải Damage Metric Map:", error);
      }
    };

    const fetchAndAggregateData = async () => {
      setIsLoading(true);
      try {
        const promises = YEARS_TO_FETCH.map((year) => getDamageDetail(year));
        const results = await Promise.all(promises);

        const aggregatedData = aggregateDamageData(results);

        setTotalDamageData(aggregatedData);

        setDamageDetailData(aggregatedData);
        setSelectedYear(null);
      } catch (error) {
        console.error("Lỗi khi tải và cộng dồn chi tiết thiệt hại:", error);
      }
      setIsLoading(false);
    };

    fetchAndAggregateData();
    fetchDamageMetricMap();
  }, []);

  const handleBarClick = async (year) => {
    setIsLoading(true);

    if (year === selectedYear) {
      setDamageDetailData(totalDamageData);
      setSelectedYear(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await getDamageDetail(year);
      setDamageDetailData(data);
      setSelectedYear(year);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết thiệt hại:", error);
    }

    setIsLoading(false);
  };

  const handleDetailItemClick = (metricName) => {
    const metricId = damageMetricMap.get(metricName);

    if (metricId) {
      setModalMetric({ name: metricName, id: metricId });
      setIsModalOpen(true);
    } else {
      console.warn(`Không tìm thấy Metric ID cho: ${metricName}`);
    }
  };

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="dashboard-grid">
        <div
          className="chart-container col-span-12"
          style={{ position: "relative", zIndex: 10 }}
        >
          <h3>Biểu đồ thống kê</h3>
          <AgricultureChart />
        </div>

        <div className="chart-container col-span-7">
          <h3>Thiệt hại Thiên tai (Theo năm)</h3>
          <p className="chart-subtitle">Click vào một cột để xem chi tiết</p>
          <DamageChart onBarClick={handleBarClick} />
        </div>

        <div className="col-span-5">
          {isLoading ? (
            <DamageDetailPlaceholder />
          ) : (
            <DamageDetailPanel
              year={selectedYear || `Tổng cộng (${YEARS_TO_FETCH.length} năm)`}
              data={damageDetailData}
              onItemClick={handleDetailItemClick}
            />
          )}
          <DamageDetailModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            metric={modalMetric}
            assetId={DEFAULT_ASSET_ID}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
