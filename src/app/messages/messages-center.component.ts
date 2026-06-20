import { Component, DestroyRef, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedModule } from '../shared/shared.module';
import { ChatContact, ChatConversation, ChatMessage } from '../shared/models/chat.model';
import { ChatService } from '../shared/services/chat.service';
import { ChatStompService } from '../shared/services/chat-stomp.service';

@Component({
  selector: 'app-messages-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './messages-center.component.html',
  styleUrl: './messages-center.component.scss'
})
export class MessagesCenterComponent implements OnInit {
  private readonly chatService = inject(ChatService);
  private readonly chatStompService = inject(ChatStompService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly unreadCount = this.chatService.unreadCount;
  readonly conversations = this.chatService.conversations;
  readonly loadingConversations = this.chatService.loadingConversations;

  readonly threadViewport = viewChild<ElementRef<HTMLDivElement>>('threadViewport');

  contacts: ChatContact[] = [];
  filteredContacts: ChatContact[] = [];
  messages: ChatMessage[] = [];
  selectedConversation: ChatConversation | null = null;
  contactSearch = '';
  conversationSearch = '';
  draft = '';
  loadingMessages = false;
  sending = false;
  showContacts = false;

  ngOnInit(): void {
    this.chatService.loadConversations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.chatService.refreshUnreadCount();
    this.loadContacts();

    this.chatService.messageReceived$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => this.onRealtimeMessage(message));

    const userId = this.route.snapshot.queryParamMap.get('user');
    if (userId) {
      this.startConversationWith(userId);
    }
  }

  toggleContacts(): void {
    this.showContacts = !this.showContacts;
    if (this.showContacts) {
      this.loadContacts();
    }
  }

  onContactSearchChange(): void {
    const term = this.contactSearch.trim().toLowerCase();
    this.filteredContacts = term
      ? this.contacts.filter(
          (contact) =>
            contact.displayName.toLowerCase().includes(term) || contact.username.toLowerCase().includes(term)
        )
      : [...this.contacts];
  }

  filteredConversations(): ChatConversation[] {
    const term = this.conversationSearch.trim().toLowerCase();
    const items = this.conversations();
    if (!term) {
      return items;
    }
    return items.filter(
      (conversation) =>
        conversation.otherDisplayName.toLowerCase().includes(term) ||
        conversation.otherUsername.toLowerCase().includes(term) ||
        (conversation.lastMessagePreview ?? '').toLowerCase().includes(term)
    );
  }

  selectConversation(conversation: ChatConversation): void {
    this.showContacts = false;
    this.selectedConversation = conversation;
    this.loadMessages(conversation.id);
    this.chatService.markConversationRead(conversation.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  startConversationWith(userId: string): void {
    this.chatService
      .openConversation(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((conversation) => {
        if (!conversation) {
          return;
        }
        this.showContacts = false;
        this.selectConversation(conversation);
      });
  }

  sendMessage(): void {
    const body = this.draft.trim();
    if (!body || this.sending) {
      return;
    }

    const conversationId = this.selectedConversation?.id;
    const recipientUserId = this.selectedConversation?.otherUserId;
    if (!conversationId && !recipientUserId) {
      return;
    }

    this.sending = true;
    const payload = { conversationId, recipientUserId, body };

    const sentViaStomp = this.chatStompService.sendMessage(payload);
    if (sentViaStomp) {
      this.draft = '';
      this.sending = false;
      return;
    }

    this.chatService
      .sendMessage(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        this.sending = false;
        if (message) {
          this.draft = '';
          if (this.selectedConversation?.id === message.conversationId) {
            this.appendMessageIfMissing(message);
            this.scrollThreadToBottom();
          }
          return;
        }
        this.draft = body;
      });
  }

  onDraftKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private loadContacts(): void {
    this.chatService
      .loadContacts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((contacts) => {
        this.contacts = contacts;
        this.onContactSearchChange();
      });
  }

  private loadMessages(conversationId: string): void {
    this.loadingMessages = true;
    this.messages = [];
    this.chatService
      .loadMessages(conversationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => {
        this.messages = [...(page.data ?? [])].reverse();
        this.loadingMessages = false;
        this.scrollThreadToBottom();
      });
  }

  private onRealtimeMessage(message: ChatMessage): void {
    if (this.selectedConversation?.id !== message.conversationId) {
      return;
    }

    this.appendMessageIfMissing(message);
    if (!message.mine) {
      this.chatService.markConversationRead(message.conversationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
    this.scrollThreadToBottom();
  }

  private appendMessageIfMissing(message: ChatMessage): void {
    if (this.messages.some((item) => item.id === message.id)) {
      return;
    }
    this.messages = [...this.messages, message];
  }

  private scrollThreadToBottom(): void {
    setTimeout(() => {
      const element = this.threadViewport()?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }
}
