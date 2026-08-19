import { useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { Auth } from './pages/Auth';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';
import { MainLayout } from './MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotificationSettings } from './components/common/NotificationSettings';
import { notificationService } from './services/notificationService';
import ChatHomePage from './pages/Home';
import { ChangePasswordPage } from './components/profile/ChangePasswordCard';

export const App = () => {
  const { hydrate } = useAuthStore();
  const { isDarkMode } = useUIStore();

  // Single client instance with production-grade defaults for chat apps
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes cache validity
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
    []
  );

  useEffect(() => {
    hydrate();
    return () => {
      notificationService.dispose();
    };
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
          {/* Public Authentication Routes (No Navbar) */}
          <Route path="/login" element={<Auth type="login" />} />
          <Route path="/register" element={<Auth type="register" />} />

          {/* Authenticated Application Shell (With Common Vertical Navbar) */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<ChatHomePage />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notification" element={<NotificationSettings />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route index element={<Navigate to="/home" replace />} />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};