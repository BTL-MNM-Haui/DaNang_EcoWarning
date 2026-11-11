import { Reac, useState } from "react";
import { sendDisasterReport } from "../../services/api";
import "./ReportPage.scss";
import LocationPickerMap from "../Map/LocationPickerMap";

const reportTypes = [
  { code: "STORM", name: "Bão / Áp thấp" },
  { code: "HIGH_WIND", name: "Lốc xoáy / Gió giật" },
  { code: "LIGHTNING", name: "Sét" },
  { code: "FLOOD", name: "Ngập lụt" },
  { code: "FLASH_FLOOD", name: "Lũ quét" },
  { code: "LANDSLIDE", name: "Sạt lở" },
  { code: "FOREST_FIRE", name: "Cháy rừng" },
  { code: "URBAN_FIRE", name: "Cháy nổ (KDC/Công nghiệp)" },
  { code: "FALLEN_TREE", name: "Cây ngã / đổ" },
  { code: "POWER_LINE_DOWN", name: "Đứt dây điện" },
  { code: "SEVERE_TRAFFIC_JAM", name: "Kẹt xe nghiêm trọng" },
];

const initialDetails = {
  estimatedDepthCm: "0.0",
  floodType: "street",

  isBlockingRoad: false,

  isNearResidential: false,

  cause: "",
  estimatedLengthKm: "0.0",
};

const ReportPage = () => {
  const GOONG_MAP_TILES_KEY = import.meta.env.VITE_GOONG_MAP_TILES_KEY;

  const [reportType, setReportType] = useState(reportTypes[3].code);
  const [formData, setFormData] = useState({
    description: "",
    latitude: 16.0544,
    longitude: 108.2021,
    addressText: "",
  });
  const [detailsData, setDetailsData] = useState(initialDetails);
  const [imageBase64, setImageBase64] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e) => {
    setReportType(e.target.value);
    setDetailsData(initialDetails);
  };

  const handleDetailsChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setDetailsData((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleLocationChange = ({ lat, lng }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let dynamicDetails = null;
    switch (reportType) {
      case "FLOOD":
        dynamicDetails = {
          estimatedDepthCm: parseFloat(detailsData.estimatedDepthCm) || 0.0,
          floodType: detailsData.floodType,
        };
        break;
      case "FALLEN_TREE":
        dynamicDetails = { isBlockingRoad: detailsData.isBlockingRoad };
        break;
      case "FOREST_FIRE":
        dynamicDetails = { isNearResidential: detailsData.isNearResidential };
        break;
      case "SEVERE_TRAFFIC_JAM":
        dynamicDetails = {
          cause: detailsData.cause,
          estimatedLengthKm: parseFloat(detailsData.estimatedLengthKm) || 0.0,
        };
        break;
      default:
        dynamicDetails = {};
    }

    const apiPayload = {
      request: {
        ...formData,
        reportType: reportType,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        eventStartTime: new Date().toISOString(),
        eventEndTime: new Date().toISOString(),
        details: dynamicDetails,
      },
      image: imageBase64 || "string",
    };

    try {
      await sendDisasterReport(apiPayload);

      alert("Báo cáo đã được gửi thành công! Cảm ơn bạn.");

      setFormData({
        description: "",
        latitude: 16.0544,
        longitude: 108.2021,
        addressText: "",
      });
      setDetailsData(initialDetails);
      setImageBase64("");
      if (document.getElementById("image-input")) {
        document.getElementById("image-input").value = null;
      }
    } catch (error) {
      alert("Gửi báo cáo thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderDynamicDetails = () => {
    switch (reportType) {
      case "FLOOD":
        return (
          <>
            <div className="form-group">
              <label htmlFor="estimatedDepthCm">Độ sâu ước tính (cm)</label>
              <input
                type="number"
                step="any"
                id="estimatedDepthCm"
                name="estimatedDepthCm"
                value={detailsData.estimatedDepthCm}
                onChange={handleDetailsChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="floodType">Loại ngập</label>
              <select
                id="floodType"
                name="floodType"
                value={detailsData.floodType}
                onChange={handleDetailsChange}
              >
                <option value="street">Ngoài đường</option>
                <option value="home">Trong nhà</option>
              </select>
            </div>
          </>
        );

      case "FALLEN_TREE":
        return (
          <div className="form-group-checkbox">
            <input
              type="checkbox"
              id="isBlockingRoad"
              name="isBlockingRoad"
              checked={detailsData.isBlockingRoad}
              onChange={handleDetailsChange}
            />
            <label htmlFor="isBlockingRoad">Có chắn ngang đường không?</label>
          </div>
        );

      case "FOREST_FIRE":
        return (
          <div className="form-group-checkbox">
            <input
              type="checkbox"
              id="isNearResidential"
              name="isNearResidential"
              checked={detailsData.isNearResidential}
              onChange={handleDetailsChange}
            />
            <label htmlFor="isNearResidential">Gần khu dân cư?</label>
          </div>
        );

      case "SEVERE_TRAFFIC_JAM":
        return (
          <>
            <div className="form-group">
              <label htmlFor="cause">Nguyên nhân (nếu biết)</label>
              <input
                type="text"
                id="cause"
                name="cause"
                value={detailsData.cause}
                onChange={handleDetailsChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="estimatedLengthKm">
                Độ dài kẹt xe ước tính (km)
              </label>
              <input
                type="number"
                step="any"
                id="estimatedLengthKm"
                name="estimatedLengthKm"
                value={detailsData.estimatedLengthKm}
                onChange={handleDetailsChange}
              />
            </div>
          </>
        );

      default:
        return <p>Loại báo cáo này không yêu cầu thông tin chi tiết thêm.</p>;
    }
  };

  return (
    <div className="report-page">
      <h2>Báo cáo Sự cố / Thiên tai</h2>
      <p>Gửi thông tin về sự cố bạn phát hiện để giúp cộng đồng.</p>

      {/* ĐÃ XÓA KHỐI DIV HIỂN THỊ MESSAGE TẠI ĐÂY */}

      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label htmlFor="reportType">Loại sự cố</label>
          <select
            id="reportType"
            name="reportType"
            value={reportType}
            onChange={handleTypeChange}
          >
            {reportTypes.map((type) => (
              <option key={type.code} value={type.code}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Mô tả ngắn (bắt buộc)</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            required
          />
        </div>

        <div className="details-group">
          <h4 style={{ marginBottom: "10px", fontWeight: "bold" }}>
            Chi tiết sự cố
          </h4>
          {renderDynamicDetails()}
        </div>

        <div className="form-group">
          <label style={{ fontWeight: "bold" }}>
            Chọn vị trí trên bản đồ (Click hoặc kéo thả ghim)
          </label>
          <LocationPickerMap
            apiKey={GOONG_MAP_TILES_KEY}
            initialLat={formData.latitude}
            initialLng={formData.longitude}
            onLocationChange={handleLocationChange}
          />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="latitude">Vĩ độ (Latitude)</label>
            <input
              type="number"
              step="any"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="longitude">Kinh độ (Longitude)</label>
            <input
              type="number"
              step="any"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={handleFormChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="addressText">Địa chỉ (nếu có)</label>
          <input
            type="text"
            id="addressText"
            name="addressText"
            value={formData.addressText}
            onChange={handleFormChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="image-input">Hình ảnh minh chứng</label>
          <input
            type="file"
            id="image-input"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imageBase64 && (
            <img src={imageBase64} alt="Preview" className="image-preview" />
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? "Đang gửi..." : "Gửi Báo Cáo"}
        </button>
      </form>
    </div>
  );
};

export default ReportPage;
