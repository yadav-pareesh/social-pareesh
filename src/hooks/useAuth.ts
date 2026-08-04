import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api/auth';
import { useAuthStore } from '../stores/authStore';

export const useLogin = () => {
  const navigate = useNavigate();
  const { setUser, setToken, setRefreshToken, setError, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: authAPI.login,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        setToken(response.data.token);
        setRefreshToken(response.data.refreshToken ?? null);
        setUser(response.data.user);
        setError(null);
        navigate('/chat');
      } else {
        setError(response.error ?? 'Login failed');
      }
    },
    onError: (error) => {
      setError(typeof error === 'string' ? error : 'Login failed');
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  const { setUser, setToken, setRefreshToken, setError, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: authAPI.register,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        setToken(response.data.token);
        setRefreshToken(response.data.refreshToken ?? null);
        setUser(response.data.user);
        setError(null);
        navigate('/chat');
      } else {
        setError(response.error ?? 'Registration failed');
      }
    },
    onError: (error) => {
      setError(typeof error === 'string' ? error : 'Registration failed');
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const { logout, setError, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: authAPI.logout,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: () => {
      logout();
      navigate('/login');
    },
    onError: () => {
      logout();
      navigate('/login');
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};