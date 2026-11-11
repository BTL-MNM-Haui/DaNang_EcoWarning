// import React, { useState, useEffect } from "react";

// // 1. IMPORT THÊM "NavigationControl" TẠI ĐÂY
// import ReactMapGL, {
//   Marker,
//   Popup,
//   NavigationControl,
// } from "@goongmaps/goong-map-react";

// import mapConfig from "../../configs/map.config";
// import mapService from "../../services/mapService";

// const GOONG_MAP_TILES_KEY = import.meta.env.VITE_GOONG_MAP_TILES_KEY;

// const MapPage = () => {
//   const [viewport, setViewport] = useState({
//     width: "100%",
//     height: "100%",
//     latitude: mapConfig.daNangCenter[0],
//     longitude: mapConfig.daNangCenter[1],
//     zoom: mapConfig.defaultZoom,
//   });

//   const [landslideData, setLandslideData] = useState([]);
//   const [selectedSite, setSelectedSite] = useState(null);

//   useEffect(() => {
//     mapService.getLandslideData().then((data) => {
//       setLandslideData(data);
//     });
//   }, []);

//   return (
//     <div className="map-page-container">
//       <ReactMapGL
//         {...viewport}
//         goongApiAccessToken={GOONG_MAP_TILES_KEY}
//         mapStyle={mapConfig.goongMapStyle}
//         onViewportChange={(nextViewport) => setViewport(nextViewport)}
//       >
//         {/* Lặp qua dữ liệu sạt lở và vẽ Marker */}
//         {landslideData.map((site) => (
//           <Marker key={site.id} latitude={site.pos[0]} longitude={site.pos[1]}>
//             <button
//               className="marker-btn"
//               onClick={(e) => {
//                 e.preventDefault();
//                 setSelectedSite(site);
//               }}
//             >
//               <span role="img" aria-label="marker">
//                 📍
//               </span>
//             </button>
//           </Marker>
//         ))}

//         {/* Hiển thị Popup nếu có 1 site được chọn */}
//         {selectedSite && (
//           <Popup
//             latitude={selectedSite.pos[0]}
//             longitude={selectedSite.pos[1]}
//             onClose={() => setSelectedSite(null)}
//             closeOnClick={false}
//           >
//             <div>
//               <b>Nguy cơ sạt lở</b>
//               <br />
//               {selectedSite.info}
//             </div>
//           </Popup>
//         )}

//         {/* 2. THÊM BỘ ĐIỀU KHIỂN PHÓNG TO/THU NHỎ VÀO ĐÂY */}
//         <NavigationControl
//           style={{
//             top: 10,
//             right: 10,
//           }}
//         />
//       </ReactMapGL>
//     </div>
//   );
// };

// export default MapPage;

// src/pages/MapPage.jsx
import React, { useState } from "react";

import "./MapPage.scss";
import GoongMap from "../../components/map/GoongMap";
import SearchBar from "../../components/common/SearchBar";
import ProfilePanel from "../../components/map/ProfilePanel";
import AssetSelector from "../../components/map/AssetSelector";

const MapPage = () => {
  const GOONG_MAP_TILES_KEY = import.meta.env.VITE_GOONG_MAP_TILES_KEY;
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedAssetType, setSelectedAssetType] = useState("");

  return (
    <div className="map-page-layout">
      <div className="map-container">
        <AssetSelector
          value={selectedAssetType}
          onChange={setSelectedAssetType}
        />

        <GoongMap
          apiKey={GOONG_MAP_TILES_KEY}
          assetType={selectedAssetType}
          onMarkerClick={setSelectedAssetId}
          selectedAssetId={selectedAssetId} 
        />
      </div>

      <ProfilePanel
        assetId={selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
      />
    </div>
  );
};
export default MapPage;
