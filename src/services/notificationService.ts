import { useNotificationStore } from "@/stores/notificationStore";

interface SoundConfig {
  key: string;
  path: string;
  volume?: number;
}

class NotificationService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private soundConfig: Map<string, SoundConfig> = new Map();

   // Register custom sounds
  registerSound(key: string, path: string, volume: number = 0.5) {
    this.soundConfig.set(key, { key, path, volume });
    this.preloadSound(key, path);
  }


   preloadSound(key: string, path: string) {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      this.audioCache.set(key, audio);
    } catch (error) {
      console.error(`Failed to preload sound ${key}:`, error);
    }
  }

   async playSound(key: string) {
    const { isEnabled, soundEnabled } = useNotificationStore.getState();
    // Check if notifications are disabled
    if (!isEnabled || !soundEnabled) {
      return;
    }
    try {
      const audio = this.audioCache.get(key);
      if (!audio) {
        console.warn(`Sound ${key} not found`);
        return;
      }

      const config = this.soundConfig.get(key);
      const clonedAudio = audio.cloneNode() as HTMLAudioElement;
      clonedAudio.volume = config?.volume || 0.5;
      clonedAudio.currentTime = 0;
      
      await clonedAudio.play().catch((error) => {
        console.error(`Failed to play sound ${key}:`, error);
      });
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }


  notify(title: string, body?: string, icon?: string) {
    const { isEnabled, browserNotificationEnabled } = useNotificationStore.getState();

    // Check if notifications are disabled
    if (!isEnabled || !browserNotificationEnabled) {
      return;
    }

    try {
      // Check browser support
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return;
      }

      // For Safari - requires user interaction
      if (Notification.permission === 'granted' && !document.hasFocus()) {
        new Notification(title, {
          body,
          icon,
          silent: true,
          badge: '/logo.png',
          requireInteraction: false,
        });
      }
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }

  vibrate() {
    const { isEnabled, vibrateEnabled } = useNotificationStore.getState();

    // Check if notifications are disabled
    if (!isEnabled || !vibrateEnabled) {
      return;
    }
    
    try {
      // Check browser support
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      } else if ('mozVibrate' in navigator) {
        // Firefox
        (navigator as any).mozVibrate([200, 100, 200]);
      }
    } catch (error) {
      console.error('Vibration failed:', error);
    }
  }

  requestPermission() {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // Get all registered sounds
  getSounds() {
    return Array.from(this.soundConfig.values());
  }

  // Remove sound
  removeSound(key: string) {
    this.audioCache.delete(key);
    this.soundConfig.delete(key);
  }

  // Dispose
  dispose() {
    this.audioCache.clear();
    this.soundConfig.clear();
  }
}

export const notificationService = new NotificationService();
// notificationService.preloadSound('message', '/sounds/message.mp3');
notificationService.registerSound('message', '/sounds/message.mp3',0.5);
notificationService.registerSound('friend-request', '/sounds/friend-request.mp3', 0.6);
notificationService.registerSound('typing', '/sounds/typing.mp3', 0.3);
notificationService.registerSound('online', '/sounds/online.mp3', 0.4);
