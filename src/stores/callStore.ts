import { create } from 'zustand';

type CallStatus = 'idle' | 'calling' | 'receiving' | 'connected';

interface CallState {
  status: CallStatus;
  targetUserId: string | null;
  callerId: string | null;
  withVideo: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callStartTime: number | null; // NEW: Track exactly when the call connected for a live UI timer
  
  setCallState: (status: CallStatus, data?: { 
    targetUserId?: string; 
    callerId?: string; 
    withVideo?: boolean;
    callStartTime?: number | null;
  }) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  endCall: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  status: 'idle',
  targetUserId: null,
  callerId: null,
  withVideo: false,
  localStream: null,
  remoteStream: null,
  callStartTime: null,

  setCallState: (status, data) => {
    // If the call is officially connected, stamp the start time so the UI can run a timer
    const newStartTime = status === 'connected' ? Date.now() : data?.callStartTime || get().callStartTime;
    set({ status, callStartTime: newStartTime, ...data });
  },
  
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  
  endCall: () => {
    // CRITICAL: Stop hardware tracks to turn off the camera light!
    const { localStream, remoteStream } = get();
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    
    set({
      status: 'idle',
      targetUserId: null,
      callerId: null,
      withVideo: false,
      localStream: null,
      remoteStream: null,
      callStartTime: null, // Reset timer
    });
  }
}));