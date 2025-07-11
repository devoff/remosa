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
<<<<<<< HEAD
  // Helper to enforce current page protocol (e.g., avoid mixed-content when app served via HTTPS)
  const fixProtocol = (url: string | undefined, httpsReplacement: string) => {
    if (!url) return httpsReplacement;
    // If app runs under https, upgrade any http:// URL pointing to the same host
    if (window.location.protocol === 'https:' && url.startsWith('http://')) {
      try {
        // URL parses successfully, now replace only scheme, keep host/port/path
        return url.replace('http://', 'https://');
      } catch {
        // If URL invalid or relative, leave as is
      }
    }
    return url;
  };

  const apiUrl = fixProtocol(window.APP_CONFIG?.API_URL, '/api/v1');
  const wsUrlRaw = fixProtocol(window.APP_CONFIG?.WS_URL, '/ws');

  // Upgrade websocket protocol if needed (ws -> wss) under https
  let wsUrl = wsUrlRaw;
  if (window.location.protocol === 'https:' && wsUrlRaw.startsWith('ws://')) {
    wsUrl = wsUrlRaw.replace('ws://', 'wss://');
  }

  return {
    API_URL: apiUrl,
    WS_URL: wsUrl,
=======
  // Убираем trailing slash из baseURL, чтобы избежать двойных слэшей
  const removeTrailingSlash = (url: string) => url.endsWith('/') ? url.slice(0, -1) : url;
  const config = {
    API_URL: removeTrailingSlash(window.APP_CONFIG?.API_URL || '/api/v1'),
    WS_URL: window.APP_CONFIG?.WS_URL || '/ws',
>>>>>>> pre-prod
    DEBUG_LOGGING: window.APP_CONFIG?.DEBUG_LOGGING || 'false'
  };
  
  if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
    console.log('Runtime Config Debug:', {
      API_URL: config.API_URL,
      WS_URL: config.WS_URL
    });
  }
  
  return config;
};

export const config = getRuntimeConfig(); 