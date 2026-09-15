import { useCallStore } from '../stores/callStore';
import { soundManager } from '../services/webrtc/soundManager';
import { webRTCManager } from '../services/webrtc/WebRTCManager';

jest.mock('../services/socket', () => ({
  getSocket: () => ({ emit: jest.fn(), on: jest.fn() }),
}));

describe('WebRTC Calling State Machine & Sound Manager', () => {
  beforeEach(() => {
    useCallStore.getState().reset();
    soundManager.stopAll();
  });

  afterEach(() => {
    useCallStore.getState().reset();
    soundManager.stopAll();
  });

  test('initial state is idle with clean defaults', () => {
    const state = useCallStore.getState();
    expect(state.status).toBe('idle');
    expect(state.callId).toBeNull();
    expect(state.otherUser).toBeNull();
    expect(state.isCaller).toBe(false);
    expect(state.isMuted).toBe(false);
    expect(state.isCameraOff).toBe(false);
    expect(state.isScreenSharing).toBe(false);
    expect(state.callDuration).toBe(0);
    expect(state.callQuality).toBe('unknown');
    expect(state.errorMessage).toBeNull();
  });

  test('transitions through calling, ringing, connecting, connected, and ended', () => {
    const store = useCallStore.getState();

    // 1. Calling
    store.setCallState('calling', {
      callId: 'call-123',
      callType: 'video',
      isCaller: true,
      otherUser: { id: 'u2', username: 'Bob', profilePicUrl: null },
    });
    expect(useCallStore.getState().status).toBe('calling');
    expect(useCallStore.getState().callId).toBe('call-123');
    expect(useCallStore.getState().isCaller).toBe(true);

    // 2. Ringing
    useCallStore.getState().setCallState('ringing');
    expect(useCallStore.getState().status).toBe('ringing');

    // 3. Connecting
    useCallStore.getState().setCallState('connecting');
    expect(useCallStore.getState().status).toBe('connecting');

    // 4. Connected
    useCallStore.getState().setCallState('connected');
    expect(useCallStore.getState().status).toBe('connected');

    // Duration update
    useCallStore.getState().setDuration(45);
    expect(useCallStore.getState().callDuration).toBe(45);

    // Quality update
    useCallStore.getState().setCallQuality('good', { rtt: 42, packetLoss: 0, jitter: 12 });
    expect(useCallStore.getState().callQuality).toBe('good');
    expect(useCallStore.getState().networkStats?.rtt).toBe(42);

    // 5. Ended
    useCallStore.getState().setCallState('ended');
    expect(useCallStore.getState().status).toBe('ended');

    // Reset
    useCallStore.getState().reset();
    expect(useCallStore.getState().status).toBe('idle');
    expect(useCallStore.getState().callId).toBeNull();
  });

  test('manages local and remote media state synchronization', () => {
    // Local toggles
    useCallStore.getState().setLocalMediaState({ isMuted: true });
    expect(useCallStore.getState().isMuted).toBe(true);

    useCallStore.getState().setLocalMediaState({ isCameraOff: true });
    expect(useCallStore.getState().isCameraOff).toBe(true);

    useCallStore.getState().setLocalMediaState({ isScreenSharing: true });
    expect(useCallStore.getState().isScreenSharing).toBe(true);

    // Remote toggles
    useCallStore.getState().setRemoteMediaState({ isMuted: true, isCameraOff: true });
    expect(useCallStore.getState().remoteMediaState.isMuted).toBe(true);
    expect(useCallStore.getState().remoteMediaState.isCameraOff).toBe(true);
    expect(useCallStore.getState().remoteMediaState.isScreenSharing).toBe(false);
  });

  test('soundManager handles ringtone and ringback stop safely', () => {
    expect(() => {
      soundManager.startRingtone();
      soundManager.stopAll();
      soundManager.startRingback();
      soundManager.stopAll();
      soundManager.playConnectedTone();
      soundManager.playEndedTone();
      soundManager.stopAll();
    }).not.toThrow();
  });

  test('WebRTCManager singleton instance is stable', () => {
    const instance1 = webRTCManager;
    const instance2 = webRTCManager;
    expect(instance1).toBe(instance2);
  });
});
