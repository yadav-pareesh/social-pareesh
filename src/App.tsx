import { useEffect, useMemo, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { Auth } from './pages/Auth';
import { Chat } from './pages/Chat';
import { NotFound } from './pages/NotFound';
import { MainLayout } from './MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { CallOverlay } from './components/chat/CallOverlay';
import { webRTCManager } from './services/webrtc/WebRTCManager';
import { notificationService } from './services/notificationService';
import { Loader2 } from 'lucide-react';

// Lazy-load secondary feature modules to keep initial bundle size lightweight
const Friends = lazy(() => import('./pages/Friends').then((m) => ({ default: m.Friends })));
const Requests = lazy(() => import('./pages/Requests').then((m) => ({ default: m.Requests })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const CallHistory = lazy(() => import('./pages/CallHistory').then((m) => ({ default: m.CallHistory })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail').then((m) => ({ default: m.VerifyEmail })));

const PageFallback = () => (
  <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

export const App = () => {
  const { hydrate } = useAuthStore();
  const { isDarkMode } = useUIStore();

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
    webRTCManager.initSocketListeners();
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
        <CallOverlay />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public Authentication Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Auth type="login" />} />
              <Route path="/register" element={<Auth type="register" />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
            </Route>

            {/* Authenticated Application Routes (/app/*) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/chats" replace />} />
              <Route path="chats" element={<Chat />} />
              <Route path="chat/:conversationId" element={<Chat />} />
              <Route path="friends" element={<Friends />} />
              <Route path="requests" element={<Requests />} />
              <Route path="calls" element={<CallHistory />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Backward-Compatibility Redirects */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/home" element={<Navigate to="/app/chats" replace />} />
              <Route path="/chat" element={<Navigate to="/app/chats" replace />} />
              <Route path="/friends" element={<Navigate to="/app/friends" replace />} />
              <Route path="/call-history" element={<Navigate to="/app/calls" replace />} />
              <Route path="/profile" element={<Navigate to="/app/settings" replace />} />
              <Route path="/notification" element={<Navigate to="/app/settings" replace />} />
              <Route path="/change-password" element={<Navigate to="/app/settings" replace />} />
            </Route>

            {/* Root Landing Redirect */}
            <Route path="/" element={<Navigate to="/app/chats" replace />} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
};