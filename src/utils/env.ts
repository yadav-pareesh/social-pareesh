declare const process: any;

/**
 * Universal safe environment variables reader across Vite (browser/bundler) and Jest (Node.js)
 */
export const getEnvVar = (key: string, defaultValue = ''): string => {

  // Statically named accessors so Vite's compiler can inline values defined in vite.config.ts
  if (key === 'VITE_API_URL' && process.env.VITE_API_URL) return process.env.VITE_API_URL;
  if (key === 'VITE_SOCKET_URL' && process.env.VITE_SOCKET_URL) return process.env.VITE_SOCKET_URL;
  if (key === 'VITE_IMAGEKIT_PUBLIC_KEY' && process.env.VITE_IMAGEKIT_PUBLIC_KEY) return process.env.VITE_IMAGEKIT_PUBLIC_KEY;
  if (key === 'VITE_IMAGEKIT_URL_ENDPOINT' && process.env.VITE_IMAGEKIT_URL_ENDPOINT) return process.env.VITE_IMAGEKIT_URL_ENDPOINT;
  if (key === 'VITE_STUN_SERVER' && process.env.VITE_STUN_SERVER) return process.env.VITE_STUN_SERVER;
  if (key === 'VITE_TURN_SERVER' && process.env.VITE_TURN_SERVER) return process.env.VITE_TURN_SERVER;
  if (key === 'VITE_TURN_USERNAME' && process.env.VITE_TURN_USERNAME) return process.env.VITE_TURN_USERNAME;
  if (key === 'VITE_TURN_CREDENTIAL' && process.env.VITE_TURN_CREDENTIAL) return process.env.VITE_TURN_CREDENTIAL;

  // Runtime fallback for Jest / Node.js
  try {
    const proc = (globalThis as any).process;
    if (proc?.env && proc.env[key] !== undefined && proc.env[key] !== '') {
      return proc.env[key];
    }
  } catch {
    // Ignore
  }

  return defaultValue;
};


