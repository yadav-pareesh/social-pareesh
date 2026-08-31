import * as React from 'react';
import {
  MessageSquare,
  Users,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Bell,
  X,
  Menu,
  History,
  Phone,
} from 'lucide-react';
import type { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { useChatStore } from '@/stores/chatStore';

export type NavTab = 'chats' | 'friends' | 'profile' | 'notifications' | 'call-history';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { conversations, activeConversationId } = useChatStore();
  const activeConversation = Array.from(conversations.values()).find((c) => c.id === activeConversationId);
  const isInActiveChat = Boolean(activeConversation || activeConversationId);

  // Prevent background scrolling when mobile menu drawer is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW: Persistent Vertical Sidebar (sm and up)                  */}
      {/* ========================================================================= */}
      <aside className="hidden sm:flex h-screen w-16 flex-col items-center justify-between border-r border-border bg-card py-4 shrink-0 select-none z-40">
        <div className="flex flex-col items-center gap-6">
          <div
            title={appName}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-sm text-primary-foreground shadow-sm"
          >
            {appName[0]?.toUpperCase() ?? 'C'}
          </div>

          <nav className="flex flex-col items-center gap-2" aria-label="Main Navigation">
            <button
              type="button"
              onClick={() => onTabChange?.('chats')}
              aria-label="Chats"
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === 'chats'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
            </button>

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

            <button
              type="button"
              onClick={() => onTabChange?.('call-history')}
              aria-label="Call History"
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === 'call-history'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Phone className="h-5 w-5" />
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
              aria-label="Open profile"
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
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-background/80 backdrop-blur-xl pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-2 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)]">
          <button
            type="button"
            onClick={() => onTabChange?.('chats')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'chats' ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
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
            <span className="text-[10px] mt-1">People</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('call-history')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'call-history' ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
          >
            <Phone className="h-5 w-5" />
            <span className="text-[10px] mt-1">Call History</span>
          </button>

          <button
            type="button"
            onClick={onProfileClick}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'profile' ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
          >
            {user ? (
              <Avatar
                user={user}
                size="sm"
                showOnlineIndicator={false}
                className="h-5 w-5 border border-border"
              />
            ) : (
              <UserIcon className="h-5 w-5" />
            )}
            <span className="text-[10px] mt-1">Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-1">Menu</span>
          </button>
        </nav>
      )}

      {/* ========================================================================= */}
      {/* 3. MOBILE SHEET DRAWER: Quick Options & Actions                           */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop dismiss */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Box */}
          <div className="relative w-full rounded-t-2xl border-t border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {appName[0]?.toUpperCase() ?? 'C'}
                </div>
                <span className="text-sm font-semibold">{appName} Options</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onTabChange?.('notifications');
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted text-foreground transition-colors"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                Notification Settings
              </button>

              <button
                type="button"
                onClick={onToggleDarkMode}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted text-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isDarkMode ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                  Appearance
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {isDarkMode ? 'Dark' : 'Light'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogoutClick();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});