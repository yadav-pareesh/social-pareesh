import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Vibrate,
  Globe,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { notificationService } from '@/services/notificationService';
import * as React from 'react';
import { Switch } from './Switch';

export const NotificationSettings = () => {
  const navigate = useNavigate();
  const {
    isEnabled,
    soundEnabled,
    vibrateEnabled,
    browserNotificationEnabled,
    toggleNotifications,
    toggleSound,
    toggleVibrate,
    toggleBrowserNotification,
  } = useNotificationStore();

  const [soundVolumes, setSoundVolumes] = React.useState<Record<string, number>>({});
  const [playingKey, setPlayingKey] = React.useState<string | null>(null);

  const sounds = React.useMemo(() => {
    return notificationService.getSounds?.() || [];
  }, []);

  const handleVolumeChange = (key: string, volume: number) => {
    setSoundVolumes((prev) => ({ ...prev, [key]: volume }));
    notificationService.registerSound?.(key, `/sounds/${key}.mp3`, volume);
  };

  const handleTestSound = (key: string) => {
    setPlayingKey(key);
    notificationService.playSound?.(key);
    setTimeout(() => setPlayingKey(null), 1200);
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-10 space-y-8">
        {/* Header with Back Button Positioned Inline */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure how you receive chat alerts, desktop toasts, and audio triggers.
            </p>
          </div>
        </div>

        {/* Master Alert Setting */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/60 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}
            >
              {isEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold">Enable Notifications</p>
              <p className="text-xs text-muted-foreground">
                {isEnabled ? 'Delivering incoming chat and mention alerts' : 'All notification alerts are muted'}
              </p>
            </div>
          </div>
          <Switch
            id="master-notification-toggle"
            aria-label="Toggle all notifications"
            checked={isEnabled}
            onCheckedChange={toggleNotifications}
          />
        </div>

        {/* Sub-Preferences Group */}
        {isEnabled ? (
          <div className="space-y-6">
            <div className="divide-y divide-border rounded-xl border border-border bg-card/40 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Sound Effects</p>
                    <p className="text-xs text-muted-foreground">Play custom tones for messages and calls</p>
                  </div>
                </div>
                <Switch
                  aria-label="Toggle sound alerts"
                  checked={soundEnabled}
                  onCheckedChange={toggleSound}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Vibrate className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Vibrate</p>
                    <p className="text-xs text-muted-foreground">Haptic feedback on supported mobile/touch devices</p>
                  </div>
                </div>
                <Switch
                  aria-label="Toggle vibration"
                  checked={vibrateEnabled}
                  onCheckedChange={toggleVibrate}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Desktop Alerts</p>
                    <p className="text-xs text-muted-foreground">Show background push toasts while tab is inactive</p>
                  </div>
                </div>
                <Switch
                  aria-label="Toggle browser notifications"
                  checked={browserNotificationEnabled}
                  onCheckedChange={toggleBrowserNotification}
                />
              </div>
            </div>

            {soundEnabled && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">Sound Packs & Audio Levels</h3>
                  <span className="text-xs text-muted-foreground">{sounds.length} sound(s) active</span>
                </div>

                {sounds.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>No audio files loaded in notification service. Default system chime will be used.</span>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sounds.map((sound) => {
                      const volume = soundVolumes[sound.key] ?? sound.volume ?? 0.5;
                      const isPlaying = playingKey === sound.key;

                      return (
                        <div
                          key={sound.key}
                          className="flex flex-col justify-between p-4 rounded-xl border border-border bg-card/40 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize truncate">{sound.key} Tone</span>
                            <button
                              type="button"
                              onClick={() => handleTestSound(sound.key)}
                              aria-label={`Test ${sound.key} sound`}
                              className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium transition-colors"
                            >
                              {isPlaying ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  Playing
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3 fill-foreground/80 text-foreground/80" />
                                  Test
                                </>
                              )}
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <VolumeX className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={(e) => handleVolumeChange(sound.key, parseFloat(e.target.value))}
                                aria-label={`${sound.key} volume level`}
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary focus-visible:outline-none"
                              />
                              <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            </div>
                            <div className="flex justify-end">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {Math.round(volume * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};