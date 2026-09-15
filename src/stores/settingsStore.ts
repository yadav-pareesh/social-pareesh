import { create } from 'zustand';
import type { PrivacySettings } from '../types';
import { usersAPI } from '../services/api/users';
import { getSocket } from '../services/socket';

interface SettingsState {
  privacySettings: PrivacySettings;
  isLoading: boolean;
  error: string | null;

  fetchPrivacySettings: () => Promise<void>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<boolean>;
}

const defaultPrivacySettings: PrivacySettings = {
  lastSeen: 'everyone',
  onlineStatus: 'everyone',
  readReceipts: true,
  friendRequests: 'everyone',
  calls: 'everyone',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  privacySettings: defaultPrivacySettings,
  isLoading: false,
  error: null,

  fetchPrivacySettings: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await usersAPI.getPrivacySettings();
      if (res.data) {
        set({ privacySettings: res.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || 'Failed to fetch privacy settings',
      });
    }
  },

  updatePrivacySettings: async (settings: Partial<PrivacySettings>) => {
    try {
      set((state) => ({
        privacySettings: { ...state.privacySettings, ...settings },
        isLoading: true,
        error: null,
      }));
      const res = await usersAPI.updatePrivacySettings(settings);
      if (res.data) {
        set({ privacySettings: res.data, isLoading: false });
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit('privacy:update');
        }
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || 'Failed to update privacy settings',
      });
      return false;
    }
  },
}));
