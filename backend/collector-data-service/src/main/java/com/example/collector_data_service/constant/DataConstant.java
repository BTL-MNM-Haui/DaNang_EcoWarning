package com.example.collector_data_service.constant;

public class DataConstant {

    private DataConstant() {
    }

    public static final String METRIC_AVG_HUMIDITY = "Độ ẩm không khí trung bình";
    public static final String METRIC_RAINFALL = "Lượng mưa";
    public static final String METRIC_AVG_TEMP = "Nhiệt độ không khí trung bình";
    public static final String METRIC_SUNSHINE_HOURS = "Số giờ nắng";
    public static final String CATEGORY_WEATHER = "Thời tiết";

    public static final String COL_TEN = "Tên";
    public static final String COL_PHAN_LOAI = "Phân loại";
    public static final String COL_DON_VI_TINH = "Đơn vị tính";

    public static final String COL_THUC_HIEN_2021 = "Thực hiện năm 2021";
    public static final String COL_UOC_TINH_2022 = "Ước tính năm 2022";
    public static final String COL_THUC_HIEN_2022 = "Thực hiện năm 2022";
    public static final String COL_UOC_TINH_2023 = "Ước tính năm 2023";
    public static final String COL_THUC_HIEN_2023 = "Thực hiện năm 2023";
    public static final String COL_UOC_TINH_2024 = "Ước tính năm 2024";

    public static final String[] HEADERS_H2022 = {
            COL_TEN, COL_PHAN_LOAI, COL_DON_VI_TINH,
            COL_THUC_HIEN_2021, COL_UOC_TINH_2022, "Năm 2022 so với năm 2021 (%)"
    };

    public static final String[] HEADERS_H2023 = {
            COL_TEN, COL_PHAN_LOAI, COL_DON_VI_TINH,
            COL_THUC_HIEN_2022, COL_UOC_TINH_2023, "Năm 2023 so với năm 2022 (%)"
    };

    public static final String[] HEADERS_H2024 = {
            COL_PHAN_LOAI, COL_TEN, COL_DON_VI_TINH,
            COL_THUC_HIEN_2023, COL_UOC_TINH_2024, "Năm 2024 so với năm 2023 (%)"
    };

    public static final String[] HEADERS_L2022 = HEADERS_H2022;
    public static final String[] HEADERS_L2023 = HEADERS_H2023;
    public static final String[] HEADERS_L2024 = HEADERS_H2024;
}
