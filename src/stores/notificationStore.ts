import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationStore {
  isEnabled: boolean;
  soundEnabled: boolean;
  inChatSoundEnabled: boolean;
  vibrateEnabled: boolean;
  browserNotificationEnabled: boolean;
  
  toggleNotifications: () => void;
  toggleSound: () => void;
  toggleInChatSound: () => void;
  toggleVibrate: () => void;
  toggleBrowserNotification: () => void;
  setNotifications: (enabled: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      isEnabled: true,
      soundEnabled: true,
      inChatSoundEnabled: true, // Default to true
      vibrateEnabled: true,
      browserNotificationEnabled: true,

      toggleNotifications: () =>
        set((state) => ({ isEnabled: !state.isEnabled })),

      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),

      toggleInChatSound: () =>
        set((state) => ({ inChatSoundEnabled: !state.inChatSoundEnabled })),

      toggleVibrate: () =>
        set((state) => ({ vibrateEnabled: !state.vibrateEnabled })),

      toggleBrowserNotification: () =>
        set((state) => ({
          browserNotificationEnabled: !state.browserNotificationEnabled,
        })),

      setNotifications: (enabled: boolean) =>
        set({ isEnabled: enabled }),
    }),
    {
      name: 'notification-settings',
    }
  )
);