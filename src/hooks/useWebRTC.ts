import { useEffect, useRef } from 'react';
import { useCallStore } from '../stores/callStore';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../stores/authStore';

// Google's free STUN servers to bypass basic firewalls
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
};

export const useWebRTC = () => {
  const { user } = useAuthStore();
  const socket = getSocket();
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  
  const { 
    status, 
    targetUserId, 
    callerId, 
    withVideo, 
    localStream, 
    setLocalStream, 
    setRemoteStream, 
    setCallState, 
    endCall 
  } = useCallStore();

  // Initialize Peer Connection
  const getPeerConnection = () => {
    if (!peerConnection.current) {
      peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

      // Listen for remote video/audio tracks
      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Send network routing coordinates to the other user
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate && (targetUserId || callerId)) {
          socket.emit('webrtc:ice-candidate', {
            targetUserId: targetUserId || callerId,
            candidate: event.candidate,
          });
        }
      };
    }
    return peerConnection.current;
  };

  // Get Camera & Mic Permissions
  const startLocalStream = async (video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Camera/Mic access denied', error);
      endCall();
      throw error;
    }
  };

  // 1. OUTGOING CALL: Create Offer
  const initiateCall = async (targetId: string, video: boolean) => {
    setCallState('calling', { targetUserId: targetId, withVideo: video });
    
    const stream = await startLocalStream(video);
    const pc = getPeerConnection();
    
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Tell the other user's UI to start ringing
    socket.emit('call:initiate', { targetUserId: targetId, callerId: user?.id, withVideo: video });
  };

  // 2. INCOMING CALL: Create Answer
  const answerCall = async () => {
    if (!callerId) return;
    
    const stream = await startLocalStream(withVideo);
    const pc = getPeerConnection();
    
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    
    setCallState('connected');
    socket.emit('call:accept', { targetUserId: callerId });
  };

  const handleHangUp = (emitToRemote = true) => {
    if (emitToRemote && (targetUserId || callerId)) {
      socket.emit('call:end', { targetUserId: targetUserId || callerId });
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    endCall();
  };

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('call:incoming', (data) => {
      setCallState('receiving', { callerId: data.callerId, withVideo: data.withVideo });
    });

    socket.on('call:accepted', async () => {
      setCallState('connected');
      const pc = getPeerConnection();
      
      // We are the caller, so we generate the Offer when they accept
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc:offer', { targetUserId, offer });
    });

    socket.on('webrtc:offer', async (data) => {
      const pc = getPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { targetUserId: data.callerId, answer });
    });

    socket.on('webrtc:answer', async (data) => {
      const pc = getPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('webrtc:ice-candidate', async (data) => {
      const pc = getPeerConnection();
      if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.on('call:ended', () => {
      handleHangUp(false); // false means don't emit back, they already ended it
    });

    socket.on('call:error', (data: { message: string }) => {
      alert(`Call failed: ${data.message}`);
      handleHangUp(false);
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('call:ended');
      socket.off('call:error');
    };
  }, [socket, targetUserId, callerId, withVideo]);

  return { initiateCall, answerCall, handleHangUp };
};