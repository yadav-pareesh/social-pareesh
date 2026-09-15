import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { ResponsiveNavbarView, type NavTab } from './ResponsiveNavbarView';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isDarkMode, setDarkMode } = useUIStore();

  const activeTab: NavTab = React.useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/app/friends')) return 'friends';
    if (path.startsWith('/app/requests')) return 'requests';
    if (path.startsWith('/app/calls') || path.startsWith('/call-history')) return 'calls';
    if (path.startsWith('/app/settings') || path.startsWith('/profile')) return 'settings';
    return 'chats';
  }, [location.pathname]);

  const handleLogout = React.useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleProfile = React.useCallback(() => {
    navigate('/app/settings');
  }, [navigate]);

  const handleToggleDarkMode = React.useCallback(() => {
    setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  const handleTabChange = React.useCallback(
    (tab: NavTab) => {
      switch (tab) {
        case 'friends':
          navigate('/app/friends');
          break;
        case 'requests':
          navigate('/app/requests');
          break;
        case 'calls':
          navigate('/app/calls');
          break;
        case 'settings':
          navigate('/app/settings');
          break;
        case 'chats':
        default:
          navigate('/app/chats');
          break;
      }
    },
    [navigate]
  );

  return (
    <ResponsiveNavbarView
      user={user}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      isDarkMode={isDarkMode}
      onToggleDarkMode={handleToggleDarkMode}
      onProfileClick={handleProfile}
      onLogoutClick={handleLogout}
    />
  );
};