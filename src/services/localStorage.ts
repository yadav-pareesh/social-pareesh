import type { User } from "@/types";

const STORAGE_PREFIX = 'chatapp_';

export const storageService = {
  setToken: (token: string) => {
    localStorage.setItem(`${STORAGE_PREFIX}token`, token);
  },

  getToken: (): string | null => {
    return localStorage.getItem(`${STORAGE_PREFIX}token`);
  },

  removeToken: () => {
    localStorage.removeItem(`${STORAGE_PREFIX}token`);
  },

  setUser: (user: User) => {
    localStorage.setItem(`${STORAGE_PREFIX}user`, JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem(`${STORAGE_PREFIX}user`);
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => {
    localStorage.removeItem(`${STORAGE_PREFIX}user`);
  },

  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(`${STORAGE_PREFIX}theme`, theme);
  },

  getTheme: (): 'light' | 'dark' => {
    const theme = localStorage.getItem(`${STORAGE_PREFIX}theme`);
    return (theme as 'light' | 'dark') || 'dark';
  },

  clear: () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },
};