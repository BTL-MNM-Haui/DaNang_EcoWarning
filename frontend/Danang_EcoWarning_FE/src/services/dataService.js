const fetchData = async (fileName) => {
  try {
    const response = await fetch(`/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return []; 
  }
};

const getLandslideData = () => {
  return fetchData("sac_lo.json");
};

const getUrbanLakesData = () => {
  return fetchData("ho_ao_do_thi.json");
};

const getRainfallData = () => {
  return fetchData("luong_mua.json");
};

const getTemperatureData = () => {
  return fetchData("nhiet_do_trung_binh.json");
};

const getHumidityData = () => {
  return fetchData("do_am_trung_binh.json");
};

const getSunshineData = () => {
  return fetchData("so_gio_nang.json");
};

const getEnvironmentKPIs = () => {
  return fetchData("chi_tieu_moi_truong.json");
};

export const dataService = {
  getLandslideData,
  getUrbanLakesData,
  getRainfallData,
  getTemperatureData,
  getHumidityData,
  getSunshineData,
  getEnvironmentKPIs,
};
