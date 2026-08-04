import { create } from 'zustand';

interface UIState {
  isDarkMode: boolean;
  sidebarOpen: boolean;
  selectedUser: string | null;
  showSearchModal: boolean;
  showUserCard: boolean;

  setDarkMode: (dark: boolean) => void;
  toggleSidebar: () => void;
  setShowUserCard: (show: boolean) => void;
  setSelectedUser: (userId: string | null) => void;
  setShowSearchModal: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: localStorage.getItem('theme') === 'dark',
  sidebarOpen: true,
  selectedUser: null,
  showSearchModal: false,
  showUserCard: false,
  setDarkMode: (dark) => {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDarkMode: dark });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSelectedUser: (userId) => set({ selectedUser: userId }),

  setShowSearchModal: (show) => set({ showSearchModal: show }),

  setShowUserCard: (show) => set({ showUserCard: show }),
}));