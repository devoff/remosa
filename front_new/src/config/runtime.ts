// Runtime конфигурация, загружаемая из window.APP_CONFIG
declare global {
  interface Window {
    APP_CONFIG?: {
      API_URL: string;
      WS_URL: string;
      DEBUG_LOGGING: string;
    }
  }
}

export const getRuntimeConfig = () => {
  return {
    API_URL: window.APP_CONFIG?.API_URL || '/api/v1',
    WS_URL: window.APP_CONFIG?.WS_URL || '/ws',
    DEBUG_LOGGING: window.APP_CONFIG?.DEBUG_LOGGING || 'false'
  };
};

export const config = getRuntimeConfig(); 