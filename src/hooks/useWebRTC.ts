import { useEffect, useCallback } from 'react';
import { webRTCManager } from '../services/webrtc/WebRTCManager';
import { useCallStore } from '../stores/callStore';
import type { CallParticipant } from '../services/webrtc/types';

export const useWebRTC = () => {
  // Ensure socket listeners are active
  useEffect(() => {
    webRTCManager.initSocketListeners();
  }, []);

  const store = useCallStore();

  const initiateCall = useCallback(
    async (targetUserId: string, withVideo: boolean, targetUser?: CallParticipant) => {
      return webRTCManager.initiateCall(targetUserId, withVideo, targetUser);
    },
    []
  );

  const answerCall = useCallback(async () => {
    return webRTCManager.acceptCall();
  }, []);

  const handleHangUp = useCallback((emitToRemote = true) => {
    const status = useCallStore.getState().status;
    if (status === 'calling') {
      webRTCManager.cancelCall();
    } else if (status === 'ringing' && !useCallStore.getState().isCaller) {
      webRTCManager.rejectCall();
    } else {
      webRTCManager.endCall(emitToRemote);
    }
  }, []);

  const toggleMic = useCallback(() => {
    return webRTCManager.toggleMicrophone();
  }, []);

  const toggleCamera = useCallback(() => {
    return webRTCManager.toggleCamera();
  }, []);

  const startScreenShare = useCallback(async () => {
    return webRTCManager.startScreenShare();
  }, []);

  const stopScreenShare = useCallback(async () => {
    return webRTCManager.stopScreenShare();
  }, []);

  const switchCamera = useCallback(async (deviceId: string) => {
    return webRTCManager.switchCamera(deviceId);
  }, []);

  const switchMicrophone = useCallback(async (deviceId: string) => {
    return webRTCManager.switchMicrophone(deviceId);
  }, []);

  const enumerateDevices = useCallback(async () => {
    return webRTCManager.enumerateDevices();
  }, []);

  const attachMediaElements = useCallback(
    (elements: {
      localVideo?: HTMLVideoElement | null;
      remoteVideo?: HTMLVideoElement | null;
      remoteAudio?: HTMLAudioElement | null;
    }) => {
      webRTCManager.attachMediaElements(elements);
    },
    []
  );

  return {
    ...store,
    initiateCall,
    answerCall,
    handleHangUp,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    switchCamera,
    switchMicrophone,
    enumerateDevices,
    attachMediaElements,
  };
};