import { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../../stores/callStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Loader2 } from 'lucide-react';

export const CallOverlay = () => {
  const { status, localStream, remoteStream, withVideo, callerId } = useCallStore();
  const { answerCall, handleHangUp } = useWebRTC();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Hardware Toggle States
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // Attach MediaStreams to HTML5 Video tags
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOff]); // Re-attach if camera toggles

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle Hardware Toggles
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center animate-in fade-in">
      
      {/* 1. Remote Video (Full Screen) or Connecting State */}
      {status === 'connected' && (
        <>
          {remoteStream && withVideo ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-zinc-400 text-lg animate-pulse">Connecting to peer...</p>
            </div>
          )}
        </>
      )}

      {/* 2. Local Video (Picture-in-Picture) */}
      {localStream && withVideo && !isCameraOff && status === 'connected' && (
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted // CRITICAL: Always mute local video to prevent audio feedback loop
          className="absolute top-6 right-6 w-32 h-48 rounded-xl object-cover border-2 border-zinc-700 shadow-2xl z-10"
        />
      )}

      {/* Local Camera-Off Placeholder */}
      {localStream && withVideo && isCameraOff && status === 'connected' && (
        <div className="absolute top-6 right-6 w-32 h-48 rounded-xl bg-zinc-800 border-2 border-zinc-700 shadow-2xl z-10 flex items-center justify-center">
          <VideoOff className="h-8 w-8 text-zinc-500" />
        </div>
      )}

      {/* Audio-Only Hidden Elements (Required for audio to play) */}
      {!withVideo && remoteStream && <audio ref={remoteVideoRef} autoPlay />}
      {!withVideo && localStream && <audio ref={localVideoRef} autoPlay muted />}

      {/* 3. Incoming/Outgoing Call Ringing Overlay */}
      {(status === 'calling' || status === 'receiving') && (
        <div className="z-20 flex flex-col items-center gap-6 mt-[-10vh]">
          <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mb-4 shadow-lg animate-bounce">
            {withVideo ? <Video className="h-10 w-10 text-primary" /> : <Phone className="h-10 w-10 text-primary" />}
          </div>
          
          {status === 'calling' && <h2 className="text-white text-2xl font-medium tracking-wide animate-pulse">Calling...</h2>}
          {status === 'receiving' && <h2 className="text-white text-2xl font-medium tracking-wide animate-pulse">Incoming Call</h2>}

          {status === 'receiving' && (
            <div className="flex gap-8 mt-12">
              <button 
                onClick={answerCall}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="p-5 bg-green-500 rounded-full group-hover:bg-green-600 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                  {withVideo ? <Video className="text-white h-7 w-7" /> : <Phone className="text-white h-7 w-7" />}
                </div>
                <span className="text-zinc-300 text-sm font-medium">Accept</span>
              </button>

              <button 
                onClick={() => handleHangUp(true)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="p-5 bg-red-500 rounded-full group-hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                  <PhoneOff className="text-white h-7 w-7" />
                </div>
                <span className="text-zinc-300 text-sm font-medium">Decline</span>
              </button>
            </div>
          )}
          
          {status === 'calling' && (
            <button 
              onClick={() => handleHangUp(true)}
              className="mt-12 p-5 bg-red-500 rounded-full hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <PhoneOff className="text-white h-7 w-7" />
            </button>
          )}
        </div>
      )}

      {/* 4. Active Call Control Bar */}
      {status === 'connected' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-zinc-900/80 backdrop-blur-md px-8 py-4 rounded-full border border-zinc-800/50 shadow-2xl flex gap-6 items-center">
            
            {/* Mic Toggle */}
            <button 
              onClick={toggleMic}
              className={`p-4 rounded-full transition-all ${isMicMuted ? 'bg-zinc-200 hover:bg-white' : 'bg-zinc-700/50 hover:bg-zinc-600'}`}
            >
              {isMicMuted ? <MicOff className="h-6 w-6 text-zinc-900" /> : <Mic className="h-6 w-6 text-white" />}
            </button>

            {/* Video Toggle (Only show on video calls) */}
            {withVideo && (
              <button 
                onClick={toggleCamera}
                className={`p-4 rounded-full transition-all ${isCameraOff ? 'bg-zinc-200 hover:bg-white' : 'bg-zinc-700/50 hover:bg-zinc-600'}`}
              >
                {isCameraOff ? <VideoOff className="h-6 w-6 text-zinc-900" /> : <Video className="h-6 w-6 text-white" />}
              </button>
            )}

            {/* Hang Up */}
            <button 
              onClick={() => handleHangUp(true)}
              className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition-all ml-2"
            >
              <PhoneOff className="text-white h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};