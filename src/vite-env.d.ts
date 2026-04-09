/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAPSTONE_SHOP_MOBILE: string;
  readonly VITE_CAPSTONE_PROJECT_SERVICE_FEE: string;
  readonly VITE_CAPSTONE_COLLEGE_LIST: string;
  readonly VITE_CAPSTONE_FEATURE_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
