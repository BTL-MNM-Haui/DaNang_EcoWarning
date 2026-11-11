
import mapConfig from "../configs/map.config";

const mockLandslideData = [
  { id: 1, pos: [16.05, 108.21], info: "Sạt lở quận Hải Châu (Mock)" },
  { id: 2, pos: [16.07, 108.22], info: "Sạt lở quận Sơn Trà (Mock)" },
  { id: 3, pos: [16.0, 108.17], info: "Sạt lở quận Cẩm Lệ (Mock)" },
];

const getLandslideData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockLandslideData);
    }, 500); 
  });
};

const geocodeLatLng = async (lat, lng) => {
  const url = `${mapConfig.restApiBaseUrl}/Geocode?latlng=${lat},${lng}&api_key=${mapConfig.restKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Geocode failed");

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0]; 
    }
    throw new Error("No address found.");
  } catch (error) {
    console.error("Lỗi Geocoding:", error);
    return null;
  }
};
export default {
  getLandslideData,
  geocodeLatLng,
};
