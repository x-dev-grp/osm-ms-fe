import { inject, Injectable } from '@angular/core';
import type { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import { TokenService } from '../../auth/services/tokenService.service';
import { ChatMessage } from '../models/chat.model';
import { ChatService } from './chat.service';

@Injectable({ providedIn: 'root' })
export class ChatStompService {
  private readonly tokenService = inject(TokenService);
  private readonly chatService = inject(ChatService);

  private client: Client | null = null;
  private connecting = false;
  private connected = false;

  connect(): void {
    const token = this.tokenService.getToken();
    if (!token || this.connecting || this.connected) {
      return;
    }

    this.disconnect();
    this.connecting = true;
    void this.bootstrapClient(token);
  }

  private async bootstrapClient(token: string): Promise<void> {
    try {
      const [{ Client: StompClient }, { default: SockJS }] = await Promise.all([
        import('@stomp/stompjs'),
        import('sockjs-client')
      ]);

      if (!this.connecting) {
        return;
      }

      this.client = new StompClient({
        webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          this.connected = true;
          this.connecting = false;
          this.client?.subscribe('/user/queue/messages', (message) => this.onMessage(message));
          this.client?.subscribe('/user/queue/unread', (message) => this.onUnread(message));
        },
        onStompError: () => {
          this.connected = false;
          this.connecting = false;
        },
        onWebSocketClose: () => {
          this.connected = false;
          this.connecting = false;
        }
      });

      this.client.activate();
    } catch {
      this.connected = false;
      this.connecting = false;
    }
  }

  disconnect(): void {
    this.connecting = false;
    this.connected = false;
    if (this.client) {
      void this.client.deactivate();
      this.client = null;
    }
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  sendMessage(payload: { conversationId?: string; recipientUserId?: string; body: string }): boolean {
    if (!this.client?.connected) {
      return false;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });
    return true;
  }

  isConnected(): boolean {
    return this.connected && !!this.client?.connected;
  }

  private onMessage(frame: IMessage): void {
    try {
      const message = JSON.parse(frame.body) as ChatMessage;
      this.chatService.handleIncomingMessage(message);
    } catch {
      // ignore malformed payloads
    }
  }

  private onUnread(frame: IMessage): void {
    try {
      const payload = JSON.parse(frame.body) as { count?: number };
      this.chatService.applyUnreadCount(payload?.count ?? 0);
    } catch {
      // ignore malformed payloads
    }
  }
}
