// WebRTC Configuration supporting STUN & TURN from environment variables with fallback defaults

const getEnvVar = (key: string): string | undefined => {
  try {
    const meta = new Function('return import.meta')();
    return meta?.env?.[key];
  } catch {
    const proc = (globalThis as any).process;
    return proc?.env?.[key];
  }
};

const getIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [];

  // Configured STUN server or standard public STUN servers
  const envStun = getEnvVar('VITE_STUN_SERVER');
  if (envStun) {
    servers.push({ urls: envStun.split(',').map((s: string) => s.trim()) });
  } else {
    servers.push(
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    );
  }

  // Configured TURN server if provided in environment
  const envTurn = getEnvVar('VITE_TURN_SERVER');
  const envTurnUser = getEnvVar('VITE_TURN_USERNAME');
  const envTurnPass = getEnvVar('VITE_TURN_CREDENTIAL');

  if (envTurn && envTurnUser && envTurnPass) {
    servers.push({
      urls: envTurn.split(',').map((s: string) => s.trim()),
      username: envTurnUser,
      credential: envTurnPass,
    });
  }

  return servers;
};

export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: getIceServers(),
  iceCandidatePoolSize: 10,
};

// Sensible constraints for media capture
export const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280, max: 1920 },
  height: { ideal: 720, max: 1080 },
  frameRate: { ideal: 30, max: 30 },
  facingMode: 'user',
};

export const SCREEN_SHARE_CONSTRAINTS: DisplayMediaStreamOptions = {
  video: {
    frameRate: { ideal: 30, max: 60 },
  },
  audio: false,
};
