export interface UserNotification {
  id: string;
  ruleCode?: string;
  module?: string;
  entity?: string;
  entityId?: string;
  title: string;
  recap: string;
  priority?: string;
  actorDisplayName?: string;
  webRoute?: string;
  payload?: Record<string, string>;
  read?: boolean;
  createdDate?: string;
  readAt?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface NotificationPageResponse {
  success: boolean;
  message: string;
  data: UserNotification[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
}
