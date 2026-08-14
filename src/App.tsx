import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useEffect } from 'react';
import { Auth } from './pages/Auth';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotificationSettings } from './components/common/NotificationSettings';
import { notificationService } from './services/notificationService';

const queryClient = new QueryClient();

export const App = () => {
  const { hydrate } = useAuthStore();
  const { isDarkMode } = useUIStore();

  useEffect(() => {
    return () => {
      notificationService.dispose();
    };
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Auth type="login" />} />
          <Route path="/register" element={<Auth type="register" />} />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notification"
            element={
              <ProtectedRoute>
                <NotificationSettings />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};