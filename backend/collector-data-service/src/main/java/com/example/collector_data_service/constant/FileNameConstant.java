package com.example.collector_data_service.constant;

public class FileNameConstant {

    private FileNameConstant() {
    }

    private static final String ENV_HYDRO_PATH = "open_data/moi_truong_va_thuy_van/";
    private static final String DISASTER_PATH = "open_data/thien_tai/";
    private static final String DISASTER_PREVENTION_PATH = "open_data/phong_chong_thien_tai/";
    private static final String AGRICULTURE_PATH = "open_data/nong_nghiep/";

    // === Môi trường và Thủy văn ===
    public static final String ENV_PONDS_LAKES = ENV_HYDRO_PATH + "danh_muc_cac_ho_ao.csv";
    public static final String ENV_IRRIGATION_LAKES = ENV_HYDRO_PATH + "danh_muc_cac_ho_thuy_loi.csv";
    public static final String ENV_RIVERS = ENV_HYDRO_PATH + "danh_muc_song_noi_tinh.csv";
    public static final String ENV_AVG_HUMIDITY = ENV_HYDRO_PATH + "do_am_khong_khi_trung_binh.csv";
    public static final String ENV_RAINFALL = ENV_HYDRO_PATH + "luong_mua.csv";
    public static final String ENV_STATS = ENV_HYDRO_PATH + "mot_so_chi_tieu_thong_ke_ve_moi_truong.csv";
    public static final String ENV_RIVER_LEVELS = ENV_HYDRO_PATH + "muc_nuoc_mot_so_song_chinh.csv";
    public static final String ENV_AVG_TEMP = ENV_HYDRO_PATH + "nhiet_do_khong_khi_trung_binh.csv";
    public static final String ENV_SUNSHINE_HOURS = ENV_HYDRO_PATH + "so_gio_nang.csv";
    public static final String ENV_YEAR_OVER_YEAR_WATER_LEVEL = ENV_HYDRO_PATH + "luong_mua_thay_doi_qua_tung_nam.csv";

    // === Thiên tai ===
    public static final String DISASTER_LANDSLIDES = DISASTER_PATH + "danh_sach_cac_khu_vuc_da_xay_ra_hien_tuong_sac_lo.csv";
    public static final String DISASTER_DAMAGE = DISASTER_PATH + "thiet_hai_do_thien_tai.csv";

    // === Phòng chống Thiên tai ===
    public static final String PREV_FLOOD_TOWERS = DISASTER_PREVENTION_PATH + "mot_so_thap_canh_bao_ngap.csv";
    public static final String PREV_AUTO_FLOOD_STATIONS = DISASTER_PREVENTION_PATH + "mot_so_tram_canh_bao_lu_tu_dong.csv";
    public static final String PREV_RAIN_STATIONS = DISASTER_PREVENTION_PATH + "mot_so_tram_do_mua_tu_dong.csv";
    public static final String PREV_STORM_SHELTERS = DISASTER_PREVENTION_PATH + "thong_tin_cac_nha_tru_bao.csv";
    public static final String PREV_COASTAL_STATIONS = DISASTER_PREVENTION_PATH + "tram_truc_canh_canh_bao_thien_tai_da_muc_tieu_ven_bien.csv";

    // === Nông nghiệp ===
    public static final String AGRI_PERENNIAL_AREA = AGRICULTURE_PATH + "dien_tich_hien_co_cay_lau_nam.csv";
    public static final String AGRI_PERENNIAL_YIELD = AGRICULTURE_PATH + "san_pham_va_san_luong_cay_lau_nam.csv";
    public static final String AGRI_ANNUAL_PROD_2022 = AGRICULTURE_PATH + "san_xuat_cay_hang_nam_nam_2022.csv";
    public static final String AGRI_ANNUAL_PROD_2023 = AGRICULTURE_PATH + "san_xuat_cay_hang_nam_nam_2023.csv";
    public static final String AGRI_ANNUAL_PROD_2024 = AGRICULTURE_PATH + "san_xuat_cay_hang_nam_nam_2024.csv";
    public static final String AGRI_PERENNIAL_PROD_2022 = AGRICULTURE_PATH + "san_xuat_cay_lau_nam_chu_yeu_2022.csv";
    public static final String AGRI_PERENNIAL_PROD_2023 = AGRICULTURE_PATH + "san_xuat_cay_lau_nam_chu_yeu_2023.csv";
    public static final String AGRI_PERENNIAL_PROD_2024 = AGRICULTURE_PATH + "san_xuat_cay_lau_nam_chu_yeu_2024.csv";
}