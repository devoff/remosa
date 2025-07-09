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
  // Убираем trailing slash из baseURL, чтобы избежать двойных слэшей
  const removeTrailingSlash = (url: string) => url.endsWith('/') ? url.slice(0, -1) : url;
  const config = {
    API_URL: removeTrailingSlash(window.APP_CONFIG?.API_URL || '/api/v1'),
    WS_URL: window.APP_CONFIG?.WS_URL || '/ws',
    DEBUG_LOGGING: window.APP_CONFIG?.DEBUG_LOGGING || 'false'
  };
  
  if (config.DEBUG_LOGGING === 'true') {
    console.log('Runtime Config Debug:', {
      'window.APP_CONFIG': window.APP_CONFIG,
      'final config': config,
      'removeTrailingSlash applied to': window.APP_CONFIG?.API_URL,
      'double slash prevention': 'enabled'
    });
  }
  
  return config;
};

export const config = getRuntimeConfig(); 