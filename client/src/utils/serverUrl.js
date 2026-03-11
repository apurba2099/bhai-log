// utils/serverUrl.js — Smart server URL detection (works on localhost + LAN/mobile)
const getServerURL = () => {
  const envURL = import.meta.env.VITE_SERVER_URL;
  const browserHost = window.location.hostname;

  if (envURL) {
    try {
      const envHost = new URL(envURL).hostname;
      // If env points to localhost but browser is on LAN IP → auto-detect instead
      if (
        (envHost === 'localhost' || envHost === '127.0.0.1') &&
        browserHost !== 'localhost' &&
        browserHost !== '127.0.0.1'
      ) {
        // fall through to auto-detect
      } else {
        return envURL;
      }
    } catch { /* fall through */ }
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000`;
};

export const SERVER_URL = getServerURL();
