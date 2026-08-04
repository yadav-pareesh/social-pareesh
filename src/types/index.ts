// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  profilePicUrl?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
  readBy: string[];
  parentMessageId?: string; // For replies
}

export interface MessageReply {
  parentMessage: Message;
}

// Conversation Types
export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  user1: User;
  user2: User;
  lastMessage?: Message;
  lastMessageTime?: Date;
  unreadCount: number;
}

// Friend Types
export interface FriendRequest {
  id: string;
  senderId: string;
  sender: User;
  receiverId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}