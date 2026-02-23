declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_VERSION: string;
  readonly VITE_API_VERSION_V0: string;
  readonly VITE_API_VERSION_V1: string;
  readonly VITE_PRONTO_RAG_CHAT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
