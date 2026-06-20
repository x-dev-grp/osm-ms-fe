export interface ChatContact {
  id: string;
  username: string;
  displayName: string;
  roleName?: string;
}

export interface ChatConversation {
  id: string;
  otherUserId: string;
  otherUsername: string;
  otherDisplayName: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderUsername?: string;
  senderDisplayName?: string;
  body: string;
  mine: boolean;
  read: boolean;
  createdDate?: string;
}

export interface SendChatMessageRequest {
  conversationId?: string;
  recipientUserId?: string;
  body: string;
}

export interface ChatMessagesPageResponse {
  success: boolean;
  data: ChatMessage[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ChatUnreadCountResponse {
  success: boolean;
  count: number;
}
