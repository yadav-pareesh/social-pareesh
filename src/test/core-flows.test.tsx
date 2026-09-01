import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../hooks/useAuth', () => ({ useLogin: () => ({ mutate: jest.fn(), isPending: false, isError: false }) }));
jest.mock('../services/api/auth', () => ({ authAPI: { forgotPassword: jest.fn(), resetPassword: jest.fn() } }));
jest.mock('../services/api/users', () => ({ usersAPI: { searchUsers: jest.fn() } }));
jest.mock('../services/api/messages', () => ({ messagesAPI: { startConversation: jest.fn() } }));
jest.mock('../hooks/useCallHistory', () => ({ useCallHistory: jest.fn() }));
jest.mock('../stores/authStore', () => ({ useAuthStore: Object.assign(() => ({ user: { id: 'u1' } }), { getState: () => ({ user: { id: 'u1' } }) }) }));
jest.mock('../stores/callStore', () => ({ useCallStore: (selector: any) => selector({ setCallState: jest.fn() }) }));
jest.mock('../services/socket', () => ({ getSocket: () => ({ emit: jest.fn() }) }));
jest.mock('../hooks/useMessageNotification', () => ({ useMessageNotification: jest.fn() }));
jest.mock('../hooks/useSocket', () => ({ useEditSocketMessage: () => jest.fn(), useDeleteSocketMessage: () => jest.fn() }));

import { LoginForm } from '../components/auth/LoginForm';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword';
import { Friends } from '../pages/Friends';
import { CallHistory } from '../pages/CallHistory';
import { MessageItem } from '../components/chat/MessageItem';
import { authAPI } from '../services/api/auth';
import { usersAPI } from '../services/api/users';
import { useCallHistory } from '../hooks/useCallHistory';

const renderWithQuery = (element: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{element}</MemoryRouter></QueryClientProvider>);

describe('authentication and password forms', () => {
  test('validates login email and password before submission', async () => {
    render(<MemoryRouter><LoginForm /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  test('rejects non-six-digit OTP and mismatched reset passwords', async () => {
    render(<MemoryRouter initialEntries={[{ pathname: '/reset-password', state: { email: 'a@example.com' } }]}><ResetPassword /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText('Verification Code'), '12ab');
    await userEvent.type(screen.getByLabelText('New Password'), 'Strong1!');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'Different1!');
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeDisabled();
    await userEvent.clear(screen.getByLabelText('Verification Code'));
    await userEvent.type(screen.getByLabelText('Verification Code'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  test('shows generic forgot-password success without email enumeration', async () => {
    (authAPI.forgotPassword as jest.Mock).mockResolvedValue({});
    renderWithQuery(<ForgotPassword />);
    await userEvent.type(screen.getByLabelText('Email Address'), 'missing@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    expect(await screen.findByText('Check your email')).toBeInTheDocument();
    expect(screen.queryByText(/not found|does not exist/i)).not.toBeInTheDocument();
  });
});

describe('friends, call history, and media rendering', () => {
  test('renders Friends empty state', async () => {
    (usersAPI.searchUsers as jest.Mock).mockResolvedValue({ data: [] });
    renderWithQuery(<Friends />);
    expect(await screen.findByText('No friends found')).toBeInTheDocument();
  });

  test('renders call history empty state and audio/video controls', async () => {
    (useCallHistory as jest.Mock).mockReturnValue({ data: { pages: [{ items: [] }] }, isLoading: false, hasNextPage: false });
    renderWithQuery(<CallHistory />);
    expect(screen.getByText('No recent calls')).toBeInTheDocument();
    (useCallHistory as jest.Mock).mockReturnValue({ data: { pages: [{ items: [{ id: 'c1', callerId: 'u1', receiverId: 'u2', type: 'video', status: 'completed', startedAt: new Date().toISOString(), duration: 30, otherUser: { id: 'u2', username: 'Bob', profilePicUrl: null } }] }] }, isLoading: false, hasNextPage: false });
    renderWithQuery(<CallHistory />);
    expect(await screen.findByText('Bob')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Audio call' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Video call' })).toBeInTheDocument();
  });

  test.each([['image', 'img', 'Shared image'], ['video', 'video', undefined]])('renders %s attachments correctly', (attachmentType, element, alt) => {
    const result = render(<MessageItem message={{ id: 'm1', conversationId: 'c1', senderId: 'u2', content: '', createdAt: new Date(), readBy: [], attachmentUrl: 'https://cdn.test/file', attachmentType: attachmentType as 'image' | 'video' }} isOwn={false} />);
    const media = element === 'img' ? screen.getByRole('img') : result.container.querySelector('video');
    if (!media) throw new Error('Expected attachment media element');
    expect(media).toBeInTheDocument();
    if (alt) expect(media).toHaveAttribute('alt', alt);
  });
});