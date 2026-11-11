package com.example.search_service.constant;

public class UrlConstant {
    public static class Asset {
        public static final String PREFIX = "/asset";
        public static final String GET_MAP = PREFIX + "/map";
        public static final String GET_ASSET_LIST = PREFIX + "/asset-list";
        public static final String GET_ASSET_PROFILE = PREFIX + "/{assetId}/profile";
    }

    public static class Static {
        public static final String PREFIX = "/static";
        public static final String COUNT_TYPE = PREFIX + "/count-type";
        public static final String DISASTER_DAMAGE_BY_YEAR = PREFIX + "/disaster-damage/by-year";
        public static final String DISASTER_DAMAGE_DETAIL = PREFIX + "/disaster-damage/detail";
        public static final String AGRICULTURE_SEARCH = PREFIX + "/agriculture/search";
        public static final String AGRICULTURE_FILTER = PREFIX + "/agriculture/filters";

    }

    public static class Metric {
        public static final String PREFIX = "/metric";
        public static final String GET_METRIC_BY_ASSET_ID = PREFIX + "/by-asset/{assetId}";
        public static final String GET_HISTORY_OF_METRIC= PREFIX + "/history";

    }

}
