import * as React from 'react';
import {
  MessageSquare,
  Users,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  Phone,
  Settings as SettingsIcon,
} from 'lucide-react';
import type { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { useChatStore } from '@/stores/chatStore';
import { useFriendStore } from '@/stores/friendStore';

export type NavTab = 'chats' | 'friends' | 'requests' | 'calls' | 'settings';

export interface ResponsiveNavbarViewProps {
  user: User | null;
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onProfileClick: () => void;
  onLogoutClick: () => void;
  appName?: string;
}

export const ResponsiveNavbarView = React.memo(function ResponsiveNavbarView({
  user,
  activeTab = 'chats',
  onTabChange,
  isDarkMode,
  onToggleDarkMode,
  onProfileClick,
  onLogoutClick,
  appName = 'Chatly',
}: ResponsiveNavbarViewProps) {
  const { conversations, activeConversationId } = useChatStore();
  const { pendingRequests } = useFriendStore();

  const totalUnread = React.useMemo(() => {
    let count = 0;
    for (const c of conversations.values()) {
      count += c.unreadCount || 0;
    }
    return count;
  }, [conversations]);

  const activeConversation = Array.from(conversations.values()).find((c) => c.id === activeConversationId);
  const isInActiveChat = Boolean(activeConversation || activeConversationId);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW: Sleek Vertical Sidebar (sm and up)                       */}
      {/* ========================================================================= */}
      <aside className="hidden sm:flex h-screen w-16 flex-col items-center justify-between border-r border-border bg-card py-4 shrink-0 select-none z-40">
        <div className="flex flex-col items-center gap-6">
          <div
            title={appName}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-sm text-primary-foreground shadow-sm cursor-pointer"
            onClick={() => onTabChange?.('chats')}
          >
            {appName[0]?.toUpperCase() ?? 'C'}
          </div>

          <nav className="flex flex-col items-center gap-2" aria-label="Main Navigation">
            {/* Chats Tab */}
            <button
              type="button"
              onClick={() => onTabChange?.('chats')}
              aria-label="Chats"
              className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === 'chats'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </button>

            {/* Friends Tab */}
            <button
              type="button"
              onClick={() => onTabChange?.('friends')}
              aria-label="Friends"
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === 'friends'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Users className="h-5 w-5" />
            </button>

            {/* Friend Requests Tab */}
            <button
              type="button"
              onClick={() => onTabChange?.('requests')}
              aria-label="Requests"
              className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === 'requests'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <UserCheck className="h-5 w-5" />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            {/* Calls Tab */}
            <button
              type="button"
              onClick={() => onTabChange?.('calls')}
              aria-label="Calls"
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === 'calls'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Phone className="h-5 w-5" />
            </button>

            {/* Settings Tab */}
            <button
              type="button"
              onClick={() => onTabChange?.('settings')}
              aria-label="Settings"
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === 'settings'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </nav>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user && (
            <button
              type="button"
              onClick={onProfileClick}
              aria-label="Open settings"
              className="flex items-center justify-center rounded-full p-0.5 hover:ring-2 hover:ring-ring/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar
                user={user}
                size="sm"
                showOnlineIndicator={false}
                className="h-8 w-8 border border-border"
              />
            </button>
          )}

          <button
            type="button"
            onClick={onLogoutClick}
            aria-label="Log out"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW: Bottom Navigation Dock (< sm)                             */}
      {/* ========================================================================= */}
      {!isInActiveChat && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-background/90 backdrop-blur-xl pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-2 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)]">
          <button
            type="button"
            onClick={() => onTabChange?.('chats')}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'chats' ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            {totalUnread > 0 && (
              <span className="absolute top-0 right-4 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
            <span className="text-[10px] mt-1">Chats</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('friends')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'friends' ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] mt-1">Friends</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('requests')}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'requests' ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
          >
            <UserCheck className="h-5 w-5" />
            {pendingRequests.length > 0 && (
              <span className="absolute top-0 right-4 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                {pendingRequests.length}
              </span>
            )}
            <span className="text-[10px] mt-1">Requests</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('calls')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'calls' ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
          >
            <Phone className="h-5 w-5" />
            <span className="text-[10px] mt-1">Calls</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('settings')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'settings' ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
            <span className="text-[10px] mt-1">Settings</span>
          </button>
        </nav>
      )}
    </>
  );
});