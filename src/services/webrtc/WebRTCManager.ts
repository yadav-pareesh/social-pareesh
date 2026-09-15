import { getSocket } from '../socket';
import { useCallStore } from '../../stores/callStore';
import { useAuthStore } from '../../stores/authStore';
import { soundManager } from './soundManager';
import {
  RTC_CONFIGURATION,
  AUDIO_CONSTRAINTS,
  VIDEO_CONSTRAINTS,
  SCREEN_SHARE_CONSTRAINTS,
} from './webrtcConfig';
import type {
  CallParticipant,
  CallType,
  CallIncomingPayload,
  CallFailedPayload,
  CallBusyPayload,
  CallOfferPayload,
  CallAnswerPayload,
  CallIceCandidatePayload,
  CallMediaStatePayload,
  CallQuality,
  MediaDeviceOption,
} from './types';

class WebRTCManager {
  private static instance: WebRTCManager;

  // WebRTC Runtime references (strictly non-persisted)
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private cameraVideoTrack: MediaStreamTrack | null = null;

  // Perfect Negotiation State
  private isMakingOffer = false;
  private ignoreOffer = false;
  private isPolite = false;
  private isSettingRemoteAnswerPending = false;
  private pendingCandidates: RTCIceCandidateInit[] = [];

  // Active call identity
  private currentCallId: string | null = null;
  private targetUserId: string | null = null;
  private isCaller = false;
  private callType: CallType = 'video';

  // Timers & Monitoring
  private durationTimer: number | null = null;
  private timeoutTimer: number | null = null;
  private statsInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;

  // Attached DOM elements
  private localVideoElement: HTMLVideoElement | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;

  // Socket listener registration flag
  private isSocketInitialized = false;

  private constructor() {
    this.setupPageLifecycleListeners();
  }

  public static getInstance(): WebRTCManager {
    if (!WebRTCManager.instance) {
      WebRTCManager.instance = new WebRTCManager();
    }
    return WebRTCManager.instance;
  }

  // Bind video/audio DOM elements from CallOverlay
  public attachMediaElements(elements: {
    localVideo?: HTMLVideoElement | null;
    remoteVideo?: HTMLVideoElement | null;
    remoteAudio?: HTMLAudioElement | null;
  }) {
    if (elements.localVideo !== undefined) {
      this.localVideoElement = elements.localVideo;
      if (this.localVideoElement && this.localStream) {
        this.localVideoElement.srcObject = this.localStream;
      }
    }

    if (elements.remoteVideo !== undefined) {
      this.remoteVideoElement = elements.remoteVideo;
      if (this.remoteVideoElement && this.remoteStream) {
        this.remoteVideoElement.srcObject = this.remoteStream;
      }
    }

    if (elements.remoteAudio !== undefined) {
      this.remoteAudioElement = elements.remoteAudio;
      if (this.remoteAudioElement && this.remoteStream) {
        this.remoteAudioElement.srcObject = this.remoteStream;
      }
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Initialize Socket.IO listeners once globally
  public initSocketListeners() {
    if (this.isSocketInitialized) return;
    const socket = getSocket();
    if (!socket) return;

    this.isSocketInitialized = true;

    socket.on('call:incoming', this.handleIncomingCall);
    socket.on('call:ringing', this.handleRemoteRinging);
    socket.on('call:accepted', this.handleCallAccepted);
    socket.on('call:rejected', this.handleCallRejected);
    socket.on('call:cancelled', this.handleCallCancelled);
    socket.on('call:busy', this.handleCallBusy);
    socket.on('call:failed', this.handleCallFailed);
    socket.on('call:dismiss', this.handleCallDismiss);
    socket.on('call:ended', this.handleRemoteEnded);
    socket.on('call:media-state', this.handleRemoteMediaState);

    // Signaling offer/answer/candidates (support both formats)
    socket.on('call:offer', this.handleRemoteOffer);
    socket.on('webrtc:offer', this.handleRemoteOffer);
    socket.on('call:answer', this.handleRemoteAnswer);
    socket.on('webrtc:answer', this.handleRemoteAnswer);
    socket.on('call:ice-candidate', this.handleRemoteIceCandidate);
    socket.on('webrtc:ice-candidate', this.handleRemoteIceCandidate);

    // Socket reconnect recovery
    socket.on('connect', this.handleSocketReconnect);
  }

  // --- Outgoing Call ---
  public async initiateCall(targetUserId: string, withVideo: boolean, targetUser?: CallParticipant) {
    const socket = getSocket();
    const currentUser = useAuthStore.getState().user;

    if (!socket || !currentUser) {
      console.error('[WebRTC] Cannot initiate call: unauthenticated or socket missing');
      return;
    }

    const state = useCallStore.getState();
    if (state.status !== 'idle') {
      console.warn('[WebRTC] Cannot initiate call: call already in progress');
      return;
    }

    this.currentCallId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.targetUserId = targetUserId;
    this.isCaller = true;
    this.isPolite = false; // Caller is impolite
    this.callType = withVideo ? 'video' : 'audio';

    useCallStore.getState().setCallState('calling', {
      callId: this.currentCallId,
      callType: this.callType,
      isCaller: true,
      otherUser: targetUser || {
        id: targetUserId,
        username: 'Connecting...',
        profilePicUrl: null,
      },
      errorMessage: null,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
    });

    try {
      // 1. Acquire local hardware permissions early
      await this.acquireLocalMedia(withVideo);

      // 2. Play ringback tone
      soundManager.startRingback();

      // 3. Start 45s outgoing timeout timer
      this.startTimeoutTimer(45000, () => {
        this.cancelCall('No answer');
      });

      // 4. Emit call:initiate
      socket.emit('call:initiate', {
        callId: this.currentCallId,
        targetUserId,
        withVideo,
        callerId: currentUser.id,
        callerName: currentUser.username,
        callerAvatar: currentUser.profilePicUrl || null,
      });
    } catch (err: any) {
      console.error('[WebRTC] Failed to acquire media for call initiation:', err);
      const friendlyMessage = this.getFriendlyMediaErrorMessage(err);
      useCallStore.getState().setErrorMessage(friendlyMessage);
      this.cleanupCall(false);
      useCallStore.getState().setCallState('failed', { errorMessage: friendlyMessage });
      setTimeout(() => useCallStore.getState().reset(), 4000);
    }
  }

  // --- Incoming Call ---
  private handleIncomingCall = (payload: CallIncomingPayload) => {
    const state = useCallStore.getState();

    // If already in a call, inform server we are busy
    if (state.status !== 'idle') {
      const socket = getSocket();
      socket?.emit('call:busy', {
        callId: payload.callId,
        targetUserId: payload.callerId,
      });
      return;
    }

    this.currentCallId = payload.callId;
    this.targetUserId = payload.callerId;
    this.isCaller = false;
    this.isPolite = true; // Receiver is polite
    this.callType = payload.withVideo ? 'video' : 'audio';

    useCallStore.getState().setCallState('ringing', {
      callId: payload.callId,
      callType: this.callType,
      isCaller: false,
      otherUser: {
        id: payload.callerId,
        username: payload.callerName,
        profilePicUrl: payload.callerAvatar,
      },
      errorMessage: null,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
    });

    // Ringing sound
    soundManager.startRingtone();

    // Notify caller that phone is ringing
    const socket = getSocket();
    socket?.emit('call:ringing', {
      callId: payload.callId,
      targetUserId: payload.callerId,
    });

    // 45s incoming timeout
    this.startTimeoutTimer(45000, () => {
      this.rejectCall('timeout');
    });
  };

  // --- Accept Call ---
  public async acceptCall() {
    if (!this.currentCallId || !this.targetUserId) return;

    this.clearTimeoutTimer();
    soundManager.stopAll();

    useCallStore.getState().setCallState('connecting');

    try {
      // 1. Acquire receiver media
      await this.acquireLocalMedia(this.callType === 'video');

      // 2. Setup RTCPeerConnection
      this.setupPeerConnection();

      // 3. Emit call:accept to notify caller
      const socket = getSocket();
      socket?.emit('call:accept', {
        callId: this.currentCallId,
        targetUserId: this.targetUserId,
      });
    } catch (err: any) {
      console.error('[WebRTC] Failed to accept call:', err);
      const friendlyMessage = this.getFriendlyMediaErrorMessage(err);
      this.rejectCall(friendlyMessage);
      useCallStore.getState().setCallState('failed', { errorMessage: friendlyMessage });
      setTimeout(() => useCallStore.getState().reset(), 4000);
    }
  }

  // --- Reject Call ---
  public rejectCall(reason = 'declined') {
    if (!this.targetUserId) return;
    const socket = getSocket();
    socket?.emit('call:reject', {
      callId: this.currentCallId,
      targetUserId: this.targetUserId,
      reason,
    });

    soundManager.stopAll();
    soundManager.playEndedTone();
    this.cleanupCall(false);
    useCallStore.getState().setCallState('rejected');
    setTimeout(() => useCallStore.getState().reset(), 2000);
  }

  // --- Cancel Call (Caller hangs up before receiver answers) ---
  public cancelCall(reason = 'cancelled') {
    if (!this.targetUserId) return;
    const socket = getSocket();
    socket?.emit('call:cancel', {
      callId: this.currentCallId,
      targetUserId: this.targetUserId,
    });

    soundManager.stopAll();
    soundManager.playEndedTone();
    this.cleanupCall(false);
    useCallStore.getState().setCallState('ended', { errorMessage: reason });
    setTimeout(() => useCallStore.getState().reset(), 2000);
  }

  // --- End Active Call ---
  public endCall(emit = true) {
    if (emit && this.targetUserId) {
      const socket = getSocket();
      socket?.emit('call:end', {
        callId: this.currentCallId,
        targetUserId: this.targetUserId,
      });
    }

    soundManager.stopAll();
    soundManager.playEndedTone();
    this.cleanupCall(false);
    useCallStore.getState().setCallState('ended');
    setTimeout(() => useCallStore.getState().reset(), 1500);
  }

  // --- Signaling Event Handlers ---
  private handleRemoteRinging = (payload: { callId: string }) => {
    if (payload.callId && payload.callId !== this.currentCallId) return;
    if (useCallStore.getState().status === 'calling') {
      useCallStore.getState().setCallState('ringing');
    }
  };

  private handleCallAccepted = async (payload: { callId?: string }) => {
    if (payload.callId && payload.callId !== this.currentCallId) return;

    this.clearTimeoutTimer();
    soundManager.stopAll();
    useCallStore.getState().setCallState('connecting');

    // Caller initializes RTCPeerConnection and adds tracks
    this.setupPeerConnection();
  };

  private handleCallRejected = (payload: { callId?: string; reason?: string }) => {
    if (payload.callId && payload.callId !== this.currentCallId) return;

    soundManager.stopAll();
    soundManager.playEndedTone();
    this.cleanupCall(false);
    const reasonText = payload.reason === 'declined' ? 'Call declined' : 'Call ended';
    useCallStore.getState().setCallState('rejected', { errorMessage: reasonText });
    setTimeout(() => useCallStore.getState().reset(), 3000);
  };

  private handleCallCancelled = (payload: { callId?: string }) => {
    if (payload.callId && payload.callId !== this.currentCallId) return;

    soundManager.stopAll();
    soundManager.playEndedTone();
    this.cleanupCall(false);
    useCallStore.getState().setCallState('ended', { errorMessage: 'Call cancelled' });
    setTimeout(() => useCallStore.getState().reset(), 2000);
  };

  private handleCallBusy = (payload: CallBusyPayload) => {
    if (payload.callId && payload.callId !== this.currentCallId) return;

    soundManager.stopAll();
    soundManager.playEndedTone();
    this.cleanupCall(false);
    useCallStore.getState().setCallState('busy', {
      errorMessage: payload.message || 'User is busy on another call',
    });
    setTimeout(() => useCallStore.getState().reset(), 3500);
  };

  private handleCallFailed = (payload: CallFailedPayload) => {
    if (payload.callId && payload.callId !== this.currentCallId) return;

    soundManager.stopAll();
    soundManager.playEndedTone();
    this.cleanupCall(false);
    useCallStore.getState().setCallState('failed', {
      errorMessage: payload.message || 'Call failed',
    });
    setTimeout(() => useCallStore.getState().reset(), 3500);
  };

  private handleCallDismiss = (payload: { callId?: string }) => {
    // Another tab answered or rejected
    if (payload.callId && payload.callId === this.currentCallId) {
      soundManager.stopAll();
      this.cleanupCall(false);
      useCallStore.getState().reset();
    }
  };

  private handleRemoteEnded = (payload: { callId?: string; reason?: string }) => {
    if (payload.callId && payload.callId !== this.currentCallId) return;

    soundManager.stopAll();
    soundManager.playEndedTone();
    this.cleanupCall(false);
    useCallStore.getState().setCallState('ended', {
      errorMessage: payload.reason === 'peer_disconnected' ? 'User disconnected' : 'Call ended',
    });
    setTimeout(() => useCallStore.getState().reset(), 2000);
  };

  private handleRemoteMediaState = (payload: CallMediaStatePayload) => {
    if (payload.callId && payload.callId !== this.currentCallId) return;
    useCallStore.getState().setRemoteMediaState({
      isMuted: Boolean(payload.isMuted),
      isCameraOff: Boolean(payload.isCameraOff),
      isScreenSharing: Boolean(payload.isScreenSharing),
    });
  };

  // --- Perfect Negotiation: Setup RTCPeerConnection ---
  private setupPeerConnection() {
    if (this.pc) return;

    this.pc = new RTCPeerConnection(RTC_CONFIGURATION);
    this.pendingCandidates = [];

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });
    }

    // Remote Track Listener
    this.pc.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      event.streams[0]?.getTracks().forEach((track) => {
        if (!this.remoteStream!.getTracks().some((t) => t.id === track.id)) {
          this.remoteStream!.addTrack(track);
        }
      });

      // Attach to video or audio element
      if (this.remoteVideoElement) {
        this.remoteVideoElement.srcObject = this.remoteStream;
      }
      if (this.remoteAudioElement) {
        this.remoteAudioElement.srcObject = this.remoteStream;
      }
    };

    // ICE Candidate generation
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.targetUserId) {
        const socket = getSocket();
        socket?.emit('call:ice-candidate', {
          callId: this.currentCallId,
          targetUserId: this.targetUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Perfect Negotiation: onnegotiationneeded
    this.pc.onnegotiationneeded = async () => {
      try {
        this.isMakingOffer = true;
        await this.pc!.setLocalDescription();
        const socket = getSocket();
        socket?.emit('call:offer', {
          callId: this.currentCallId,
          targetUserId: this.targetUserId,
          offer: this.pc!.localDescription,
        });
      } catch (err) {
        console.error('[WebRTC] Error during negotiation needed:', err);
      } finally {
        this.isMakingOffer = false;
      }
    };

    // Connection state changes
    this.pc.onconnectionstatechange = () => {
      const connState = this.pc?.connectionState;
      console.log(`[WebRTC] Connection state: ${connState}`);

      if (connState === 'connected') {
        this.onCallConnected();
      } else if (connState === 'disconnected') {
        this.onCallDisconnected();
      } else if (connState === 'failed') {
        this.onCallFailed();
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      const iceState = this.pc?.iceConnectionState;
      console.log(`[WebRTC] ICE connection state: ${iceState}`);

      if (iceState === 'disconnected') {
        this.onCallDisconnected();
      } else if (iceState === 'failed') {
        this.attemptIceRestart();
      }
    };
  }

  // --- Perfect Negotiation: Offer & Answer Handling ---
  private handleRemoteOffer = async (payload: CallOfferPayload) => {
    if (payload.callId && this.currentCallId && payload.callId !== this.currentCallId) return;

    if (!this.pc) {
      this.setupPeerConnection();
    }

    try {
      const offer = new RTCSessionDescription(payload.offer);
      const readyForOffer =
        !this.isMakingOffer &&
        (this.pc!.signalingState === 'stable' || this.isSettingRemoteAnswerPending);

      const offerCollision = !readyForOffer;

      this.ignoreOffer = !this.isPolite && offerCollision;
      if (this.ignoreOffer) {
        console.warn('[WebRTC] Offer collision: impolite peer ignored incoming offer');
        return;
      }

      this.isSettingRemoteAnswerPending = offer.type === 'answer';
      await this.pc!.setRemoteDescription(offer);
      this.isSettingRemoteAnswerPending = false;

      // Flush any queued candidates
      await this.flushPendingCandidates();

      if (offer.type === 'offer') {
        await this.pc!.setLocalDescription();
        const socket = getSocket();
        socket?.emit('call:answer', {
          callId: this.currentCallId,
          targetUserId: this.targetUserId,
          answer: this.pc!.localDescription,
        });
      }
    } catch (err) {
      console.error('[WebRTC] Error handling remote offer/answer:', err);
    }
  };

  private handleRemoteAnswer = async (payload: CallAnswerPayload) => {
    if (payload.callId && this.currentCallId && payload.callId !== this.currentCallId) return;
    if (!this.pc) return;

    try {
      const answer = new RTCSessionDescription(payload.answer);
      await this.pc.setRemoteDescription(answer);
      await this.flushPendingCandidates();
    } catch (err) {
      console.error('[WebRTC] Error setting remote answer:', err);
    }
  };

  // --- ICE Candidate Handling ---
  private handleRemoteIceCandidate = async (payload: CallIceCandidatePayload) => {
    if (payload.callId && this.currentCallId && payload.callId !== this.currentCallId) return;

    if (!payload.candidate) return;

    if (!this.pc || !this.pc.remoteDescription || !this.pc.remoteDescription.type) {
      // Queue candidate until remoteDescription is set
      this.pendingCandidates.push(payload.candidate);
      return;
    }

    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    } catch (err) {
      if (!this.ignoreOffer) {
        console.warn('[WebRTC] Error adding received ICE candidate:', err);
      }
    }
  };

  private async flushPendingCandidates() {
    if (!this.pc || !this.pc.remoteDescription) return;

    const candidates = [...this.pendingCandidates];
    this.pendingCandidates = [];

    for (const cand of candidates) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn('[WebRTC] Error flushing candidate:', err);
      }
    }
  }

  // --- Active Call Transitions & Quality Monitoring ---
  private onCallConnected() {
    soundManager.stopAll();
    soundManager.playConnectedTone();

    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    useCallStore.getState().setCallState('connected');

    // Start 1s duration timer
    if (!this.durationTimer) {
      let duration = 0;
      this.durationTimer = window.setInterval(() => {
        duration += 1;
        useCallStore.getState().setDuration(duration);
      }, 1000);
    }

    // Start network stats monitoring
    this.startQualityMonitor();
  }

  private onCallDisconnected() {
    useCallStore.getState().setCallState('reconnecting');

    // Set 15-second grace period for auto-recovery
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = window.setTimeout(() => {
        if (this.pc && this.pc.connectionState !== 'connected') {
          console.warn('[WebRTC] Connection recovery timed out');
          this.endCall(true);
        }
      }, 15000);
    }
  }

  private onCallFailed() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptIceRestart();
    } else {
      useCallStore.getState().setCallState('failed', {
        errorMessage: 'Connection lost. Please try calling again.',
      });
      setTimeout(() => this.endCall(true), 3000);
    }
  }

  private attemptIceRestart() {
    if (!this.pc || this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts += 1;
    console.log(`[WebRTC] Attempting ICE restart (attempt ${this.reconnectAttempts})...`);

    try {
      this.pc.restartIce();
    } catch (e) {
      console.warn('[WebRTC] restartIce failed:', e);
    }
  }

  private startQualityMonitor() {
    if (this.statsInterval) clearInterval(this.statsInterval);

    this.statsInterval = window.setInterval(async () => {
      if (!this.pc || this.pc.connectionState !== 'connected') return;

      try {
        const stats = await this.pc.getStats();
        let rtt: number | undefined;
        let packetLoss: number | undefined;
        let jitter: number | undefined;
        let quality: CallQuality = 'good';

        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime !== undefined) {
              rtt = Math.round(report.currentRoundTripTime * 1000);
            }
          }
          if (report.type === 'inbound-rtp' && (report.kind === 'video' || report.kind === 'audio')) {
            if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
              const total = report.packetsLost + report.packetsReceived;
              if (total > 0) {
                packetLoss = Math.round((report.packetsLost / total) * 100);
              }
            }
            if (report.jitter !== undefined) {
              jitter = Math.round(report.jitter * 1000);
            }
          }
        });

        if ((rtt && rtt > 400) || (packetLoss && packetLoss > 15)) {
          quality = 'bad';
        } else if ((rtt && rtt > 200) || (packetLoss && packetLoss > 5)) {
          quality = 'poor';
        }

        useCallStore.getState().setCallQuality(quality, {
          rtt,
          packetLoss,
          jitter,
        });
      } catch (err) {
        // Stats query failed, ignore
      }
    }, 2500);
  }

  // --- Hardware & Media Management ---
  private async acquireLocalMedia(video: boolean): Promise<MediaStream> {
    // Release existing stream if present
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: AUDIO_CONSTRAINTS,
      video: video ? VIDEO_CONSTRAINTS : false,
    });

    this.localStream = stream;
    this.cameraVideoTrack = stream.getVideoTracks()[0] || null;

    if (this.localVideoElement) {
      this.localVideoElement.srcObject = stream;
    }

    return stream;
  }

  public toggleMicrophone(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return false;

    audioTrack.enabled = !audioTrack.enabled;
    const isMuted = !audioTrack.enabled;

    useCallStore.getState().setLocalMediaState({ isMuted });
    this.broadcastMediaState();

    return isMuted;
  }

  public toggleCamera(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    videoTrack.enabled = !videoTrack.enabled;
    const isCameraOff = !videoTrack.enabled;

    useCallStore.getState().setLocalMediaState({ isCameraOff });
    this.broadcastMediaState();

    return isCameraOff;
  }

  public async switchMicrophone(deviceId: string) {
    if (!this.pc) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { ...AUDIO_CONSTRAINTS, deviceId: { exact: deviceId } },
        video: false,
      });

      const newTrack = newStream.getAudioTracks()[0];
      if (!newTrack) return;

      const sender = this.pc.getSenders().find((s) => s.track?.kind === 'audio');
      if (sender) {
        await sender.replaceTrack(newTrack);
      }

      // Replace track in localStream
      if (this.localStream) {
        const oldTrack = this.localStream.getAudioTracks()[0];
        if (oldTrack) {
          this.localStream.removeTrack(oldTrack);
          oldTrack.stop();
        }
        this.localStream.addTrack(newTrack);
      }
    } catch (err) {
      console.error('[WebRTC] Error switching microphone:', err);
    }
  }

  public async switchCamera(deviceId: string) {
    if (!this.pc) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { ...VIDEO_CONSTRAINTS, deviceId: { exact: deviceId } },
      });

      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) return;

      this.cameraVideoTrack = newTrack;

      const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newTrack);
      }

      // Replace track in localStream
      if (this.localStream) {
        const oldTrack = this.localStream.getVideoTracks()[0];
        if (oldTrack) {
          this.localStream.removeTrack(oldTrack);
          oldTrack.stop();
        }
        this.localStream.addTrack(newTrack);
      }

      if (this.localVideoElement) {
        this.localVideoElement.srcObject = this.localStream;
      }
    } catch (err) {
      console.error('[WebRTC] Error switching camera:', err);
    }
  }

  public async startScreenShare(): Promise<boolean> {
    if (!navigator.mediaDevices?.getDisplayMedia || !this.pc) {
      console.warn('[WebRTC] Screen sharing not supported in this browser');
      return false;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia(SCREEN_SHARE_CONSTRAINTS);
      const screenTrack = displayStream.getVideoTracks()[0];

      if (!screenTrack) return false;

      this.screenStream = displayStream;

      // Replace current video track with screen track
      const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      useCallStore.getState().setLocalMediaState({ isScreenSharing: true });
      this.broadcastMediaState();

      // Automatically restore camera when screen share ends
      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      return true;
    } catch (err) {
      console.warn('[WebRTC] Screen share cancelled or failed:', err);
      return false;
    }
  }

  public async stopScreenShare() {
    if (!this.screenStream && !useCallStore.getState().isScreenSharing) return;

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Restore camera track to video sender
    if (this.pc && this.cameraVideoTrack) {
      const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(this.cameraVideoTrack);
      }
    }

    useCallStore.getState().setLocalMediaState({ isScreenSharing: false });
    this.broadcastMediaState();
  }

  public async enumerateDevices(): Promise<MediaDeviceOption[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `${d.kind} (${d.deviceId.substring(0, 5)})`,
        kind: d.kind,
      }));
    } catch (err) {
      console.error('[WebRTC] Failed to enumerate devices:', err);
      return [];
    }
  }

  private broadcastMediaState() {
    const { isMuted, isCameraOff, isScreenSharing } = useCallStore.getState();
    if (!this.targetUserId) return;

    const socket = getSocket();
    socket?.emit('call:media-state', {
      callId: this.currentCallId,
      targetUserId: this.targetUserId,
      isMuted,
      isCameraOff,
      isScreenSharing,
    });
  }

  // --- Centralized, Idempotent Cleanup ---
  private cleanupCall(resetState = true) {
    soundManager.stopAll();

    this.clearTimeoutTimer();

    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Stop and release screen share
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }

    // Stop and release local stream tracks (turns off camera and mic lights)
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    // Clear remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((t) => t.stop());
      this.remoteStream = null;
    }

    this.cameraVideoTrack = null;

    // Detach elements
    if (this.localVideoElement) {
      this.localVideoElement.srcObject = null;
    }
    if (this.remoteVideoElement) {
      this.remoteVideoElement.srcObject = null;
    }
    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = null;
    }

    // Close and dispose RTCPeerConnection
    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.onnegotiationneeded = null;
      this.pc.onconnectionstatechange = null;
      this.pc.oniceconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }

    this.pendingCandidates = [];
    this.isMakingOffer = false;
    this.ignoreOffer = false;
    this.isSettingRemoteAnswerPending = false;
    this.reconnectAttempts = 0;

    this.currentCallId = null;
    this.targetUserId = null;

    if (resetState) {
      useCallStore.getState().reset();
    }
  }

  // --- Page Lifecycle & Disconnect Handlers ---
  private setupPageLifecycleListeners() {
    const handleUnload = () => {
      if (this.currentCallId && this.targetUserId) {
        const socket = getSocket();
        socket?.emit('call:end', {
          callId: this.currentCallId,
          targetUserId: this.targetUserId,
        });
      }
      this.cleanupCall(true);
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
  }

  private handleSocketReconnect = () => {
    const state = useCallStore.getState();
    if (state.status === 'connected' && this.pc) {
      console.log('[WebRTC] Socket reconnected during active call; refreshing signaling state');
      this.broadcastMediaState();
    }
  };

  private startTimeoutTimer(ms: number, onTimeout: () => void) {
    this.clearTimeoutTimer();
    this.timeoutTimer = window.setTimeout(onTimeout, ms);
  }

  private clearTimeoutTimer() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  private getFriendlyMediaErrorMessage(error: any): string {
    const errName = error?.name || '';
    switch (errName) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Camera or microphone access denied. Please allow permissions in browser settings.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No camera or microphone found on this device.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Camera or microphone is currently in use by another application.';
      case 'OverconstrainedError':
        return 'Camera does not satisfy the required video constraints.';
      default:
        return 'Failed to access camera or microphone.';
    }
  }
}

export const webRTCManager = WebRTCManager.getInstance();
