import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { ResponsiveNavbarView, type NavTab } from './ResponsiveNavbarView';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDarkMode, setDarkMode } = useUIStore();
  const [activeTab, setActiveTab] = React.useState<NavTab>('chats');

  const handleLogout = React.useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleProfile = React.useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  const handleToggleDarkMode = React.useCallback(() => {
    setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  const handleTabChange = React.useCallback(
    (tab: NavTab) => {
      setActiveTab(tab);
      if (tab === 'friends') {
        navigate('/friends');
      } else if (tab === 'call-history') {
        navigate('/call-history');
      } else {
        navigate('/');
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