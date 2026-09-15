import { useEffect, useRef, useState, useMemo } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  MonitorOff,
  Maximize2,
  Minimize2,
  Settings,
  Wifi,
  Loader2,
  PictureInPicture2,
  Check,
  X,
} from 'lucide-react';
import type { MediaDeviceOption } from '../../services/webrtc/types';

export const CallOverlay = () => {
  const {
    status,
    callType,
    isCaller,
    otherUser,
    isMuted,
    isCameraOff,
    isScreenSharing,
    remoteMediaState,
    callDuration,
    callQuality,
    networkStats,
    errorMessage,
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
  } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceOption[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');

  // Attach media elements whenever refs are bound
  useEffect(() => {
    attachMediaElements({
      localVideo: localVideoRef.current,
      remoteVideo: remoteVideoRef.current,
      remoteAudio: remoteAudioRef.current,
    });
  }, [attachMediaElements, status, isCameraOff, isScreenSharing]);

  // Load devices on opening device settings
  useEffect(() => {
    if (showDeviceSettings) {
      enumerateDevices().then((devices) => {
        setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
        setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
      });
    }
  }, [showDeviceSettings, enumerateDevices]);

  // Format call duration MM:SS or HH:MM:SS
  const formattedDuration = useMemo(() => {
    const hours = Math.floor(callDuration / 3600);
    const minutes = Math.floor((callDuration % 3600) / 60);
    const seconds = callDuration % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, [callDuration]);

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Picture in Picture toggle
  const togglePiP = async () => {
    if (remoteVideoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await remoteVideoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('PiP request failed:', err);
      }
    }
  };

  if (status === 'idle') return null;

  const isVideoCall = callType === 'video';

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Active Call Window"
      className="fixed inset-0 z-[99999] bg-zinc-950 text-white flex flex-col items-center justify-between select-none overflow-hidden transition-all duration-300"
    >
      {/* Hidden audio element ensuring remote audio playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ========================================================================= */}
      {/* 1. CALLING / RINGING OVERLAY (OUTGOING & INCOMING) */}
      {/* ========================================================================= */}
      {(status === 'calling' || status === 'ringing') && (
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative flex items-center justify-center mb-8">
            {/* Animated Radar Ripples */}
            <div className="absolute w-44 h-44 rounded-full bg-emerald-500/10 animate-ping duration-1000" />
            <div className="absolute w-36 h-36 rounded-full bg-emerald-500/20 animate-pulse duration-700" />

            {/* Avatar */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-zinc-800 shadow-2xl bg-zinc-900 flex items-center justify-center">
              {otherUser?.profilePicUrl ? (
                <img
                  src={otherUser.profilePicUrl}
                  alt={otherUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-primary/20 text-primary">
                  {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
            {otherUser?.username || 'Connecting...'}
          </h2>

          <div className="mt-2 flex items-center gap-2 text-zinc-400 text-sm sm:text-base">
            {isVideoCall ? (
              <span className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
                <Video className="w-4 h-4 text-emerald-400" />
                Incoming Video Call
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
                <Phone className="w-4 h-4 text-emerald-400" />
                Incoming Audio Call
              </span>
            )}
          </div>

          <p className="mt-3 text-sm text-zinc-500 animate-pulse">
            {status === 'calling'
              ? 'Calling...'
              : isCaller
                ? 'Ringing...'
                : 'Incoming call...'}
          </p>

          {/* Action Buttons */}
          <div className="mt-12 flex items-center justify-center gap-10">
            {/* Receiver: Accept & Decline */}
            {!isCaller && status === 'ringing' ? (
              <>
                <button
                  onClick={() => handleHangUp(false)}
                  aria-label="Decline Call"
                  className="group flex flex-col items-center gap-2 focus:outline-none"
                >
                  <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-red-900/40">
                    <PhoneOff className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400 group-hover:text-white">
                    Decline
                  </span>
                </button>

                <button
                  onClick={answerCall}
                  aria-label="Accept Call"
                  className="group flex flex-col items-center gap-2 focus:outline-none"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-emerald-900/40 animate-bounce">
                    {isVideoCall ? (
                      <Video className="w-7 h-7 text-white" />
                    ) : (
                      <Phone className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-zinc-400 group-hover:text-white">
                    Accept
                  </span>
                </button>
              </>
            ) : (
              /* Caller: Cancel */
              <button
                onClick={() => handleHangUp(true)}
                aria-label="Cancel Call"
                className="group flex flex-col items-center gap-2 focus:outline-none"
              >
                <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-red-900/40">
                  <PhoneOff className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-medium text-zinc-400 group-hover:text-white">
                  Cancel
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TERMINATION STATES (REJECTED, BUSY, ENDED, FAILED) */}
      {/* ========================================================================= */}
      {(status === 'rejected' ||
        status === 'busy' ||
        status === 'ended' ||
        status === 'failed') && (
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95">
          <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
            <PhoneOff className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold">
            {status === 'busy'
              ? 'User Busy'
              : status === 'rejected'
                ? 'Call Declined'
                : status === 'failed'
                  ? 'Call Failed'
                  : 'Call Ended'}
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-sm text-center">
            {errorMessage || (status === 'busy' ? 'The user is currently on another call.' : 'Call session finished.')}
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ACTIVE CALL (CONNECTING, CONNECTED, RECONNECTING) */}
      {/* ========================================================================= */}
      {(status === 'connecting' ||
        status === 'connected' ||
        status === 'reconnecting') && (
        <>
          {/* Top Header Bar */}
          <div className="w-full z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-zinc-700/60">
                {otherUser?.profilePicUrl ? (
                  <img
                    src={otherUser.profilePicUrl}
                    alt={otherUser.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-sm bg-primary/20 text-primary">
                    {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-sm sm:text-base leading-tight">
                  {otherUser?.username || 'Call'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-400 font-mono">
                    {status === 'connected' ? formattedDuration : 'Connecting...'}
                  </span>

                  {/* Connection Quality Pill */}
                  {status === 'connected' && (
                    <div
                      title={
                        networkStats?.rtt !== undefined
                          ? `Latency: ${networkStats.rtt}ms | Loss: ${networkStats.packetLoss || 0}%`
                          : 'Call quality'
                      }
                      className="flex items-center gap-1 bg-zinc-800/80 px-2 py-0.5 rounded-full text-[10px] text-zinc-300 border border-zinc-700/50"
                    >
                      <Wifi
                        className={`w-3 h-3 ${
                          callQuality === 'good'
                            ? 'text-emerald-400'
                            : callQuality === 'poor'
                              ? 'text-amber-400'
                              : 'text-red-400'
                        }`}
                      />
                      <span className="capitalize">{callQuality}</span>
                    </div>
                  )}

                  {status === 'reconnecting' && (
                    <span className="flex items-center gap-1 text-xs text-amber-400 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Reconnecting...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Remote Peer Badges & Utilities */}
            <div className="flex items-center gap-2">
              {remoteMediaState.isMuted && (
                <span className="flex items-center gap-1 bg-red-500/20 text-red-400 text-xs px-2.5 py-1 rounded-full border border-red-500/30">
                  <MicOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Muted</span>
                </span>
              )}

              {remoteMediaState.isScreenSharing && (
                <span className="flex items-center gap-1 bg-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-blue-500/30">
                  <MonitorUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Screen</span>
                </span>
              )}

              {isVideoCall && (
                <>
                  <button
                    onClick={togglePiP}
                    aria-label="Picture in Picture"
                    className="p-2.5 rounded-full bg-zinc-800/60 hover:bg-zinc-700/80 backdrop-blur-md transition-colors text-zinc-300 hover:text-white"
                  >
                    <PictureInPicture2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    className="p-2.5 rounded-full bg-zinc-800/60 hover:bg-zinc-700/80 backdrop-blur-md transition-colors text-zinc-300 hover:text-white"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main View Area (Speaker View / Video or Audio Wave) */}
          <div className="relative flex-1 w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden">
            {isVideoCall ? (
              <>
                {/* Remote Video Stream */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    remoteMediaState.isCameraOff ? 'opacity-0' : 'opacity-100'
                  }`}
                />

                {/* Remote Camera Off Placeholder */}
                {remoteMediaState.isCameraOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
                    <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-zinc-800 bg-zinc-800 flex items-center justify-center mb-4">
                      {otherUser?.profilePicUrl ? (
                        <img
                          src={otherUser.profilePicUrl}
                          alt={otherUser.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary">
                          {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-400 font-medium">Camera is off</p>
                  </div>
                )}

                {/* Floating Local Video Preview (PiP) */}
                <div className="absolute bottom-28 right-4 sm:bottom-28 sm:right-6 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-700/80 bg-zinc-900 z-20 transition-all hover:scale-105">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted // Prevent feedback loop
                    className={`w-full h-full object-cover scale-x-[-1] ${
                      isCameraOff ? 'hidden' : 'block'
                    }`}
                  />
                  {isCameraOff && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-400">
                      <VideoOff className="w-8 h-8 mb-2" />
                      <span className="text-[11px] font-medium">Camera Off</span>
                    </div>
                  )}
                  {isMuted && (
                    <div className="absolute bottom-2 right-2 bg-red-600/90 text-white p-1 rounded-full shadow">
                      <MicOff className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Audio-Only Call Experience */
              <div className="flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="relative mb-8">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden ring-4 ring-emerald-500/30 bg-zinc-900 shadow-2xl flex items-center justify-center">
                    {otherUser?.profilePicUrl ? (
                      <img
                        src={otherUser.profilePicUrl}
                        alt={otherUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-primary/20 text-primary">
                        {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  {/* Subtle pulsing ring while connected */}
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-pulse pointer-events-none" />
                </div>

                <h3 className="text-2xl font-bold tracking-tight">
                  {otherUser?.username || 'Audio Call'}
                </h3>
                <p className="mt-2 text-emerald-400 font-mono text-sm">
                  {status === 'connected' ? formattedDuration : 'Connecting audio...'}
                </p>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM CONTROL DOCK */}
          {/* ========================================================================= */}
          <div className="w-full z-30 pb-8 pt-4 px-4 flex flex-col items-center bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <div className="relative flex items-center gap-3 sm:gap-4 px-6 py-3.5 rounded-full bg-zinc-900/85 backdrop-blur-xl border border-zinc-800 shadow-2xl">
              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                className={`p-3 sm:p-3.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                  isMuted
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera Toggle (Video only) */}
              {isVideoCall && (
                <button
                  onClick={toggleCamera}
                  aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
                  className={`p-3 sm:p-3.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    isCameraOff
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {isCameraOff ? (
                    <VideoOff className="w-5 h-5" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Screen Share (Video only) */}
              {isVideoCall && (
                <button
                  onClick={() => (isScreenSharing ? stopScreenShare() : startScreenShare())}
                  aria-label={isScreenSharing ? 'Stop screen share' : 'Share screen'}
                  className={`p-3 sm:p-3.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    isScreenSharing
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {isScreenSharing ? (
                    <MonitorOff className="w-5 h-5" />
                  ) : (
                    <MonitorUp className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Device Settings Popover Button */}
              <button
                onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                aria-label="Audio and Video device settings"
                className="p-3 sm:p-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Hang Up Button */}
              <button
                onClick={() => handleHangUp(true)}
                aria-label="End call"
                className="p-3 sm:p-3.5 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 transition-all text-white shadow-lg shadow-red-900/40 ml-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

            {/* Device Settings Popup Modal */}
            {showDeviceSettings && (
              <div className="absolute bottom-28 w-80 max-w-[90vw] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 z-40 text-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <span className="font-semibold text-zinc-200">Device Settings</span>
                  <button
                    onClick={() => setShowDeviceSettings(false)}
                    className="text-zinc-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Microphones */}
                <div className="mt-3">
                  <label className="text-xs font-medium text-zinc-400 block mb-1">
                    Microphone
                  </label>
                  <select
                    value={selectedAudioId}
                    onChange={(e) => {
                      setSelectedAudioId(e.target.value);
                      switchMicrophone(e.target.value);
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || 'Default Microphone'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cameras (only video call) */}
                {isVideoCall && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-zinc-400 block mb-1">
                      Camera
                    </label>
                    <select
                      value={selectedVideoId}
                      onChange={(e) => {
                        setSelectedVideoId(e.target.value);
                        switchCamera(e.target.value);
                      }}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {videoDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || 'Default Camera'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};