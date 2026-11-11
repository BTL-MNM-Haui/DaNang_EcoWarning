import React, { useState, useEffect } from "react";

import { getAssetProfile } from "../../services/api";

import "../../styles/components/_profile-panel.scss";

const ProfilePanel = ({ assetId, onClose }) => {
  const [data, setData] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!assetId) {
      setData(null);

      return;
    }

    const fetchData = async () => {
      setIsLoading(true);

      try {
        const result = await getAssetProfile(assetId);

        setData(result);
      } catch (error) {
        console.error("Lỗi khi lấy profile:", error);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [assetId]);

  const renderAttributes = (attributes) => {
    if (!attributes) return null;

    return Object.entries(attributes).map(([key, value]) => {
      if (key == "image_url") {
        return null;
      }

      return (
        <div className="profile-item" key={key}>
          <span>{key}:</span>

          <strong>{value}</strong>
        </div>
      );
    });
  };

  const renderLatestData = (latestData) => {
    if (!latestData || latestData.length === 0) {
      return <p>Không có dữ liệu đo đạc mới nhất.</p>;
    }

    return latestData.map((metric, index) => (
      <div className="profile-item latest-data" key={index}>
        <span>{metric.metricName}:</span>

        <strong>
          {metric.value} {metric.unit}
        </strong>
      </div>
    ));
  };

  const isOpen = assetId !== null;

  return (
    <div className={`profile-panel ${isOpen ? "open" : ""}`}>
      <button onClick={onClose} className="close-btn">
        &times;
      </button>

      {isLoading && <div className="loader">Đang tải...</div>}

      {!isLoading && data && (
        <div className="profile-content">
          <h3>{data.name}</h3>

          <p className="asset-type">{data.assetType}</p>

          <div className="profile-section">
            <h4>Thông tin chung</h4>

            <div className="profile-item">
              <span>Địa chỉ:</span>

              <strong>{data.address || "Chưa cập nhật"}</strong>
            </div>

            {renderAttributes(data.attributes)}

            {data.attributes && data.attributes.image_url && (
              <div className="profile-image-container">
                <img
                  src={data.attributes.image_url}
                  alt={data.name || "Ảnh tài sản"}
                  className="profile-image"
                />
              </div>
            )}
          </div>

          <div className="profile-section">
            <h4>Dữ liệu mới nhất</h4>

            {renderLatestData(data.latestData)}
          </div>
        </div>
      )}

      {!isLoading && !data && isOpen && (
        <div className="loader">Không thể tải dữ liệu.</div>
      )}
    </div>
  );
};

export default ProfilePanel;
