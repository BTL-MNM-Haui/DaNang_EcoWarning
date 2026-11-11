import React, { useState, useEffect } from "react";
import { getAssetCountByType } from "../../services/api";
import "../../styles/components/_asset-selector.scss";

const MAP_ASSET_TYPES = [
  "Khu Vực Sạt Lở",
  "Nhà Trú Bão",
  "Hồ Ao",
  "Hồ Thủy Lợi",
  "Trạm Cảnh Báo Ven Biển",
  "Trạm Đo Mưa",
];

const AssetSelector = ({ value, onChange }) => {
  const [typeData, setTypeData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await getAssetCountByType();

        const mapTypes = results.filter((item) =>
          MAP_ASSET_TYPES.includes(item.assetType)
        );

        const totalCount = mapTypes.reduce((sum, item) => sum + item.count, 0);

        const formattedData = mapTypes.map((item) => ({
          name: item.assetType,
          count: item.count,
          percentage: (item.count / totalCount) * 100,
        }));

        setTypeData(formattedData);
      } catch (error) {

      }
    };

    fetchData();
  }, []);

  return (
    <div className="asset-selector-container">
      {typeData.map((asset) => (
        <button
          key={asset.name}
          className={`asset-button ${value === asset.name ? "active" : ""}`}
          onClick={() => onChange(asset.name)}
        >
          <span className="button-title">{asset.name}</span>
          <span className="button-percentage">
            {asset.percentage.toFixed(0)}%
          </span>
        </button>
      ))}
    </div>
  );
};

export default AssetSelector;
