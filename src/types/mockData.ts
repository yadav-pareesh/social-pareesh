import type { User, Message, Conversation, FriendRequest, AuthResponse, ApiResponse, PaginatedResponse } from './index';

// ============================================
// USER MOCK DATA
// ============================================
export const mockUsers: User[] = [
  {
    id: 'user-001',
    username: 'john_doe',
    email: 'john.doe@example.com',
    bio: 'Software developer | Coffee enthusiast ☕ | Tech lover',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john_doe',
    status: 'online',
    lastSeen: new Date(),
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'user-002',
    username: 'sarah_smith',
    email: 'sarah.smith@example.com',
    bio: 'UI/UX Designer | Photography lover 📸 | Creative mind',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah_smith',
    status: 'online',
    lastSeen: new Date(),
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 'user-003',
    username: 'mike_wilson',
    email: 'mike.wilson@example.com',
    bio: 'Full-stack developer | Open source contributor | Music lover 🎵',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike_wilson',
    status: 'offline',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'user-004',
    username: 'emma_johnson',
    email: 'emma.johnson@example.com',
    bio: 'Product Manager | Foodie 🍜 | Traveler',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma_johnson',
    status: 'away',
    lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    createdAt: new Date('2024-02-05'),
  },
  {
    id: 'user-005',
    username: 'alex_chen',
    email: 'alex.chen@example.com',
    bio: 'AI/ML Engineer | Tech writer | Basketball player 🏀',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex_chen',
    status: 'online',
    lastSeen: new Date(),
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'user-006',
    username: 'jessica_taylor',
    email: 'jessica.taylor@example.com',
    bio: 'Graphic Designer | Artist | Coffee addict ☕',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jessica_taylor',
    status: 'offline',
    lastSeen: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'user-007',
    username: 'david_brown',
    email: 'david.brown@example.com',
    bio: 'Backend Engineer | DevOps enthusiast | Gaming',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david_brown',
    status: 'online',
    lastSeen: new Date(),
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 'user-008',
    username: 'sophia_martinez',
    email: 'sophia.martinez@example.com',
    bio: 'Data Scientist | Book lover 📚 | Nature enthusiast',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophia_martinez',
    status: 'offline',
    lastSeen: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'user-009',
    username: 'james_anderson',
    email: 'james.anderson@example.com',
    bio: 'Frontend Developer | Web3 enthusiast | Crypto trader',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james_anderson',
    status: 'away',
    lastSeen: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    createdAt: new Date('2024-01-25'),
  },
  {
    id: 'user-010',
    username: 'olivia_lee',
    email: 'olivia.lee@example.com',
    bio: 'Mobile App Developer | Yoga instructor | Minimalist',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia_lee',
    status: 'online',
    lastSeen: new Date(),
    createdAt: new Date('2024-02-15'),
  },
];

// ============================================
// MESSAGE MOCK DATA
// ============================================
export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'Hey! How are you doing today?',
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    readBy: ['user-2', 'user-1'],
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'user-2',
    content: 'Doing great! Just finished a new design project. You?',
    createdAt: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
    readBy: ['user-1', 'user-2'],
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'That sounds awesome! Would love to see it sometime 🎨',
    createdAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    editedAt: new Date(Date.now() - 2 * 60 * 1000), // Edited 2 minutes ago
    readBy: ['user-2'],
  },
  {
    id: 'msg-4',
    conversationId: 'conv-1',
    senderId: 'user-2',
    content: 'Sure! I will send you the portfolio link tomorrow',
    createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    readBy: ['user-1', 'user-2'],
    parentMessageId: 'msg-3', // Reply to msg-3
  },
  {
    id: 'msg-5',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'This message was accidentally sent',
    createdAt: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
    deletedAt: new Date(Date.now() - 30 * 1000), // Deleted 30 seconds ago
    readBy: [],
  },
];

// ============================================
// CONVERSATION MOCK DATA
// ============================================
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    user1Id: 'user-1',
    user2Id: 'user-2',
    user1: mockUsers[0],
    user2: mockUsers[1],
    lastMessage: mockMessages[3],
    lastMessageTime: new Date(Date.now() - 2 * 60 * 1000),
    unreadCount: 0,
  },
  {
    id: 'conv-2',
    user1Id: 'user-1',
    user2Id: 'user-3',
    user1: mockUsers[0],
    user2: mockUsers[2],
    lastMessage: {
      id: 'msg-6',
      conversationId: 'conv-2',
      senderId: 'user-3',
      content: 'Hey John! Did you see the new React updates?',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      readBy: [],
    },
    lastMessageTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
    unreadCount: 1,
  },
  {
    id: 'conv-3',
    user1Id: 'user-1',
    user2Id: 'user-4',
    user1: mockUsers[0],
    user2: mockUsers[3],
    lastMessage: {
      id: 'msg-7',
      conversationId: 'conv-3',
      senderId: 'user-1',
      content: 'Thanks for the design feedback! Really helpful 👍',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      readBy: ['user-4'],
    },
    lastMessageTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
    unreadCount: 0,
  },
  {
    id: 'conv-4',
    user1Id: 'user-1',
    user2Id: 'user-5',
    user1: mockUsers[0],
    user2: mockUsers[4],
    lastMessage: {
      id: 'msg-8',
      conversationId: 'conv-4',
      senderId: 'user-5',
      content: 'Have you tried the new AI features in VSCode?',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      readBy: [],
    },
    lastMessageTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
    unreadCount: 2,
  },
  {
    id: 'conv-5',
    user1Id: 'user-2',
    user2Id: 'user-3',
    user1: mockUsers[1],
    user2: mockUsers[2],
    lastMessage: {
      id: 'msg-9',
      conversationId: 'conv-5',
      senderId: 'user-2',
      content: 'Let me know when you are free for coffee',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      readBy: ['user-3'],
    },
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    unreadCount: 0,
  },
];

// ============================================
// FRIEND REQUEST MOCK DATA
// ============================================
export const mockFriendRequests: FriendRequest[] = [
  {
    id: 'freq-1',
    senderId: 'user-3',
    sender: mockUsers[2],
    receiverId: 'user-1',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'freq-2',
    senderId: 'user-4',
    sender: mockUsers[3],
    receiverId: 'user-1',
    status: 'pending',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    id: 'freq-3',
    senderId: 'user-5',
    sender: mockUsers[4],
    receiverId: 'user-1',
    status: 'accepted',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    id: 'freq-4',
    senderId: 'user-1',
    sender: mockUsers[0],
    receiverId: 'user-2',
    status: 'accepted',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  },
  {
    id: 'freq-5',
    senderId: 'user-3',
    sender: mockUsers[2],
    receiverId: 'user-4',
    status: 'blocked',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  },
];

// ============================================
// AUTH RESPONSE MOCK DATA
// ============================================
export const mockAuthResponses: AuthResponse[] = [
  {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJpYXQiOjE3MDQwNjcyMDB9.mockToken1',
    user: mockUsers[0],
  },
  {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTIiLCJpYXQiOjE3MDQwNjcyMDB9.mockToken2',
    user: mockUsers[1],
  },
  {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTMiLCJpYXQiOjE3MDQwNjcyMDB9.mockToken3',
    user: mockUsers[2],
  },
  {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTQiLCJpYXQiOjE3MDQwNjcyMDB9.mockToken4',
    user: mockUsers[3],
  },
  {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTUiLCJpYXQiOjE3MDQwNjcyMDB9.mockToken5',
    user: mockUsers[4],
  },
];

// ============================================
// API RESPONSE MOCK DATA
// ============================================
export const mockApiResponses: ApiResponse<any>[] = [
  {
    success: true,
    data: mockUsers[0],
    message: 'User retrieved successfully',
  },
  {
    success: true,
    data: mockMessages,
    message: 'Messages retrieved successfully',
  },
  {
    success: true,
    data: mockConversations[0],
    message: 'Conversation retrieved successfully',
  },
  {
    success: false,
    error: 'User not found',
    message: 'The requested user does not exist',
  },
  {
    success: false,
    error: 'Unauthorized',
    message: 'You do not have permission to perform this action',
  },
];

// ============================================
// PAGINATED RESPONSE MOCK DATA
// ============================================
export const mockPaginatedResponses: PaginatedResponse<any>[] = [
  {
    items: mockUsers,
    total: 50,
    page: 1,
    limit: 5,
  },
  {
    items: mockMessages,
    total: 150,
    page: 1,
    limit: 5,
  },
  {
    items: mockConversations,
    total: 25,
    page: 1,
    limit: 5,
  },
  {
    items: mockFriendRequests,
    total: 10,
    page: 1,
    limit: 5,
  },
  {
    items: mockUsers.slice(0, 3),
    total: 3,
    page: 1,
    limit: 5,
  },
];

// ============================================
// COMBINED MOCK DATA EXPORT
// ============================================
export const mockData = {
  users: mockUsers,
  messages: mockMessages,
  conversations: mockConversations,
  friendRequests: mockFriendRequests,
  authResponses: mockAuthResponses,
  apiResponses: mockApiResponses,
  paginatedResponses: mockPaginatedResponses,
};