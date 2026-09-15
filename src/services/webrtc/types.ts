export type CallType = 'audio' | 'video';

export type CallStatus =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ending'
  | 'ended'
  | 'rejected'
  | 'busy'
  | 'failed';

export type CallQuality = 'good' | 'poor' | 'bad' | 'unknown';

export interface CallParticipant {
  id: string;
  username: string;
  profilePicUrl: string | null;
}

export interface CallMediaState {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
}

export interface CallNetworkStats {
  rtt?: number; // Round-trip time in ms
  packetLoss?: number; // % packet loss
  jitter?: number; // in seconds or ms
  bitrate?: number; // in kbps
}

export interface MediaDeviceOption {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

// Socket Signaling Payloads
export interface CallInitiatePayload {
  callId: string;
  targetUserId: string;
  withVideo: boolean;
  callerId?: string;
  callerName?: string;
  callerAvatar?: string | null;
}

export interface CallIncomingPayload {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string | null;
  withVideo: boolean;
}

export interface CallRingingPayload {
  callId: string;
}

export interface CallAcceptPayload {
  callId: string;
  targetUserId: string;
}

export interface CallRejectPayload {
  callId: string;
  targetUserId: string;
  reason?: string;
}

export interface CallCancelPayload {
  callId: string;
  targetUserId: string;
}

export interface CallEndPayload {
  callId: string;
  targetUserId?: string;
  reason?: string;
}

export interface CallBusyPayload {
  callId: string;
  targetUserId: string;
  message?: string;
}

export interface CallFailedPayload {
  callId: string;
  reason: string;
  message: string;
}

export interface CallOfferPayload {
  callId?: string;
  targetUserId?: string;
  offer: RTCSessionDescriptionInit;
  callerId?: string;
}

export interface CallAnswerPayload {
  callId?: string;
  targetUserId?: string;
  answer: RTCSessionDescriptionInit;
  callerId?: string;
}

export interface CallIceCandidatePayload {
  callId?: string;
  targetUserId?: string;
  candidate: RTCIceCandidateInit;
  callerId?: string;
}

export interface CallMediaStatePayload {
  callId?: string;
  targetUserId?: string;
  userId?: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isScreenSharing?: boolean;
}
