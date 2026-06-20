import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ChatContact,
  ChatConversation,
  ChatMessage,
  ChatMessagesPageResponse,
  ChatUnreadCountResponse,
  SendChatMessageRequest
} from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/chat`;

  readonly unreadCount = signal(0);
  readonly conversations = signal<ChatConversation[]>([]);
  readonly loadingConversations = signal(false);

  private readonly messageReceivedSubject = new Subject<ChatMessage>();
  readonly messageReceived$ = this.messageReceivedSubject.asObservable();

  refreshUnreadCount(): void {
    this.http
      .get<ChatUnreadCountResponse>(`${this.baseUrl}/unread-count`)
      .pipe(catchError(() => of({ success: false, count: 0 })))
      .subscribe((response) => this.unreadCount.set(response?.count ?? 0));
  }

  loadConversations(): Observable<ChatConversation[]> {
    this.loadingConversations.set(true);
    return this.http.get<ChatConversation[]>(`${this.baseUrl}/conversations`).pipe(
      tap((items) => {
        this.conversations.set(items ?? []);
        this.loadingConversations.set(false);
      }),
      catchError(() => {
        this.conversations.set([]);
        this.loadingConversations.set(false);
        return of([]);
      })
    );
  }

  loadContacts(): Observable<ChatContact[]> {
    return this.http.get<ChatContact[]>(`${this.baseUrl}/contacts`).pipe(catchError(() => of([])));
  }

  openConversation(userId: string): Observable<ChatConversation | null> {
    return this.http.post<ChatConversation>(`${this.baseUrl}/conversations/with/${userId}`, {}).pipe(
      tap((conversation) => {
        if (conversation) {
          this.upsertConversation(conversation);
        }
      }),
      catchError(() => of(null))
    );
  }

  loadMessages(conversationId: string, page = 0, size = 50): Observable<ChatMessagesPageResponse> {
    return this.http
      .get<ChatMessagesPageResponse>(`${this.baseUrl}/conversations/${conversationId}/messages`, {
        params: { page: String(page), size: String(size) }
      })
      .pipe(
        catchError(() =>
          of({
            success: false,
            data: [],
            total: 0,
            page: 1,
            totalPages: 0
          })
        )
      );
  }

  sendMessage(request: SendChatMessageRequest): Observable<ChatMessage | null> {
    return this.http.post<ChatMessage>(`${this.baseUrl}/messages`, request).pipe(
      tap((message) => {
        if (message) {
          this.handleIncomingMessage(message);
        }
      }),
      catchError(() => of(null))
    );
  }

  markConversationRead(conversationId: string): Observable<void> {
    return this.http.patch<{ success: boolean }>(`${this.baseUrl}/conversations/${conversationId}/read`, {}).pipe(
      tap(() => {
        this.conversations.update((items) =>
          items.map((item) => (item.id === conversationId ? { ...item, unreadCount: 0 } : item))
        );
        this.refreshUnreadCount();
      }),
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  handleIncomingMessage(message: ChatMessage): void {
    this.messageReceivedSubject.next(message);
    this.conversations.update((items) => {
      const existing = items.find((item) => item.id === message.conversationId);
      if (!existing && message.mine) {
        return items;
      }
      const preview = message.body?.length > 500 ? `${message.body.slice(0, 497)}...` : message.body;
      const updated: ChatConversation = existing
        ? {
            ...existing,
            lastMessagePreview: preview,
            lastMessageAt: message.createdDate ?? new Date().toISOString(),
            unreadCount: message.mine ? existing.unreadCount : existing.unreadCount + 1
          }
        : {
            id: message.conversationId,
            otherUserId: message.mine ? '' : message.senderUserId,
            otherUsername: message.mine ? '' : message.senderUsername ?? '',
            otherDisplayName: message.mine ? '' : message.senderDisplayName ?? message.senderUsername ?? '',
            lastMessagePreview: preview,
            lastMessageAt: message.createdDate ?? new Date().toISOString(),
            unreadCount: message.mine ? 0 : 1
          };

      const without = items.filter((item) => item.id !== message.conversationId);
      return [updated, ...without].sort((left, right) => this.compareConversationDates(left, right));
    });
  }

  applyUnreadCount(count: number): void {
    this.unreadCount.set(Math.max(0, count));
  }

  reset(): void {
    this.unreadCount.set(0);
    this.conversations.set([]);
    this.loadingConversations.set(false);
  }

  private upsertConversation(conversation: ChatConversation): void {
    this.conversations.update((items) => {
      const without = items.filter((item) => item.id !== conversation.id);
      return [conversation, ...without].sort((left, right) => this.compareConversationDates(left, right));
    });
  }

  private compareConversationDates(left: ChatConversation, right: ChatConversation): number {
    const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
    const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
    return rightTime - leftTime;
  }
}
