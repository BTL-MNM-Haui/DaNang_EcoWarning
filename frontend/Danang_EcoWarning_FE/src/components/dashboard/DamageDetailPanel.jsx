import React from "react";

import "../../styles/components/_damage-detail-panel.scss";

const DamageDetailPanel = ({ year, data, onItemClick }) => {
  return (
    <div className="detail-panel-container chart-container">
      <h3>Chi tiết Thiệt hại Năm {year}</h3>
      <p className="chart-subtitle" style={{ marginTop: "6px" }}>
        Click vào một mục để xem lịch sử
      </p>

      <div className="detail-list">
        {!data || data.length === 0 ? (
          <p>Không có dữ liệu chi tiết cho năm này.</p>
        ) : (
          data.map((item, index) => (
            <div
              className="list-item clickable"
              key={index}
              onClick={() => onItemClick && onItemClick(item.metricName)}
              title={`Xem lịch sử: ${item.metricName}`}
            >
              <span>{item.metricName}</span>
              <strong>
                {item.value} {item.unit}
              </strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export const DamageDetailPlaceholder = () => {
  return (
    <div className="detail-panel-placeholder chart-container">
      <div className="placeholder-content">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          width="64"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h15.75c.621 0 1.125.504 1.125 1.125v6.75C21 20.496 20.496 21 19.875 21H4.125C3.504 21 3 20.496 3 19.875v-6.75z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8.625C3 8.004 3.504 7.5 4.125 7.5h15.75c.621 0 1.125.504 1.125 1.125v1.5C21 10.896 20.496 11.4 19.875 11.4H4.125C3.504 11.4 3 10.896 3 10.125v-1.5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1.5m0 15V21m-4.5-1.5h9"
          />
        </svg>
        <p>Click vào một cột trên biểu đồ "Thiệt hại" để xem chi tiết.</p>
      </div>
    </div>
  );
};

export default DamageDetailPanel;
