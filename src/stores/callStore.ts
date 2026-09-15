import { create } from 'zustand';
import type {
  CallStatus,
  CallType,
  CallQuality,
  CallParticipant,
  CallMediaState,
  CallNetworkStats,
} from '../services/webrtc/types';

export interface CallStoreState {
  callId: string | null;
  status: CallStatus;
  callType: CallType;
  isCaller: boolean;
  otherUser: CallParticipant | null;

  // Local device states
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;

  // Remote device states
  remoteMediaState: CallMediaState;

  // Call metrics
  callDuration: number; // seconds
  callQuality: CallQuality;
  networkStats: CallNetworkStats | null;
  errorMessage: string | null;

  // Actions
  setCallState: (
    status: CallStatus,
    patch?: Partial<{
      callId: string | null;
      callType: CallType;
      isCaller: boolean;
      otherUser: CallParticipant | null;
      errorMessage: string | null;
      isMuted: boolean;
      isCameraOff: boolean;
      isScreenSharing: boolean;
    }>
  ) => void;
  setLocalMediaState: (patch: Partial<CallMediaState>) => void;
  setRemoteMediaState: (patch: Partial<CallMediaState>) => void;
  setCallQuality: (quality: CallQuality, stats?: CallNetworkStats) => void;
  setDuration: (duration: number) => void;
  setErrorMessage: (msg: string | null) => void;
  reset: () => void;
}

const initialState = {
  callId: null,
  status: 'idle' as CallStatus,
  callType: 'audio' as CallType,
  isCaller: false,
  otherUser: null,
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  remoteMediaState: {
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
  },
  callDuration: 0,
  callQuality: 'unknown' as CallQuality,
  networkStats: null,
  errorMessage: null,
};

export const useCallStore = create<CallStoreState>((set) => ({
  ...initialState,

  setCallState: (status, patch) =>
    set((state) => ({
      ...state,
      status,
      ...(patch || {}),
    })),

  setLocalMediaState: (patch) =>
    set((state) => ({
      ...state,
      ...patch,
    })),

  setRemoteMediaState: (patch) =>
    set((state) => ({
      ...state,
      remoteMediaState: {
        ...state.remoteMediaState,
        ...patch,
      },
    })),

  setCallQuality: (callQuality, networkStats) =>
    set((state) => ({
      ...state,
      callQuality,
      networkStats: networkStats || state.networkStats,
    })),

  setDuration: (callDuration) => set({ callDuration }),

  setErrorMessage: (errorMessage) => set({ errorMessage }),

  reset: () => set({ ...initialState }),
}));