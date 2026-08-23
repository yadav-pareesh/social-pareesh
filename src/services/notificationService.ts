import { useNotificationStore } from "@/stores/notificationStore";

export interface SoundConfig {
  key: string;
  path: string;
  volume?: number;
}

class NotificationService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private soundConfig: Map<string, SoundConfig> = new Map();

  registerSound(key: string, path: string, volume: number = 0.5) {
    this.soundConfig.set(key, { key, path, volume });
    this.preloadSound(key, path, volume);
  }

  preloadSound(key: string, path: string, volume: number) {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.volume = volume;
      this.audioCache.set(key, audio);
    } catch (error) {
      console.error(`Failed to preload sound ${key}:`, error);
    }
  }

  // Plays sound with support for forcing playback (settings page) and volume dampening (in-chat)
  async playSound(key: string, force: boolean = false, volumeMultiplier: number = 1) {
    const { isEnabled, soundEnabled } = useNotificationStore.getState();
    
    if (!force && (!isEnabled || !soundEnabled)) {
      return;
    }
    
    try {
      const audio = this.audioCache.get(key);
      if (!audio) return;

      const config = this.soundConfig.get(key);
      const baseVolume = config?.volume || 0.5;
      
      audio.volume = Math.min(Math.max(baseVolume * volumeMultiplier, 0), 1);
      audio.currentTime = 0;
      
      await audio.play().catch((error) => {
        console.warn(`Browser autoplay blocked sound '${key}'.`, error);
      });
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  notify(title: string, body?: string, icon?: string) {
    const { isEnabled, browserNotificationEnabled } = useNotificationStore.getState();

    if (!isEnabled || !browserNotificationEnabled) return;

    try {
      if (!('Notification' in window)) return;

      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: icon || '/logo.png',
          silent: true, 
          requireInteraction: false,
        });
      }
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }

  vibrate() {
    const { isEnabled, vibrateEnabled } = useNotificationStore.getState();
    if (!isEnabled || !vibrateEnabled) return;
    
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      } else if ('mozVibrate' in navigator) {
        (navigator as any).mozVibrate([200, 100, 200]);
      }
    } catch (error) {
      console.error('Vibration failed:', error);
    }
  }

  // --- Restored Methods Required for Settings UI & Browser Permissions ---

  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  getSounds() {
    return Array.from(this.soundConfig.values());
  }

  removeSound(key: string) {
    this.audioCache.delete(key);
    this.soundConfig.delete(key);
  }

  dispose() {
    this.audioCache.clear();
    this.soundConfig.clear();
  }
}

export const notificationService = new NotificationService();

// Register default application sounds
notificationService.registerSound('message', '/sounds/message.mp3', 0.5);
notificationService.registerSound('friend-request', '/sounds/friend-request.mp3', 0.6);
notificationService.registerSound('typing', '/sounds/typing.mp3', 0.3);
notificationService.registerSound('online', '/sounds/online.mp3', 0.4);