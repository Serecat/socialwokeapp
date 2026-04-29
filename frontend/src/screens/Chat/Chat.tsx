import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ChatConversation,
  ChatMessageItem,
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  UserBasic,
  getAccessToken,
} from '../../services/api';

interface ChatProps {
  initialPartnerId?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Chat: React.FC<ChatProps> = ({ initialPartnerId }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activePartner, setActivePartner] = useState<UserBasic | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect Socket.IO
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const socket = io(`${API_BASE}/chat`, {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('newMessage', (msg: ChatMessageItem) => {
      // newMessage is only emitted to the recipient, so msg.sender is always the partner
      const partner = msg.sender;
      setMessages((prev) => [msg, ...prev]);
      setConversations((prev) => {
        const existing = prev.find((c) => c.user.id === partner.id);
        if (existing) {
          return prev.map((c) =>
            c.user.id === partner.id
              ? { ...c, lastMessage: msg.content, lastAt: msg.createdAt }
              : c,
          );
        }
        return [{ user: partner, lastMessage: msg.content, lastAt: msg.createdAt }, ...prev];
      });
    });

    socket.on('messageSent', (msg: ChatMessageItem) => {
      // messageSent is only emitted to the sender, so msg.receiver is the partner
      const partner = msg.receiver;
      setMessages((prev) => [msg, ...prev]);
      setConversations((prev) => {
        const existing = prev.find((c) => c.user.id === partner.id);
        if (existing) {
          return prev.map((c) =>
            c.user.id === partner.id
              ? { ...c, lastMessage: msg.content, lastAt: msg.createdAt }
              : c,
          );
        }
        return [{ user: partner, lastMessage: msg.content, lastAt: msg.createdAt }, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load conversations list
  useEffect(() => {
    setIsLoadingConvos(true);
    getChatConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setIsLoadingConvos(false));
  }, []);

  // Open initial partner if provided
  useEffect(() => {
    if (initialPartnerId && conversations.length > 0) {
      const convo = conversations.find((c) => c.user.id === initialPartnerId);
      if (convo) openConversation(convo.user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPartnerId, conversations.length]);

  const openConversation = useCallback((partner: UserBasic) => {
    setActivePartner(partner);
    setMessages([]);
    setIsLoadingMessages(true);

    socketRef.current?.emit('joinConversation', { partnerId: partner.id });

    getChatMessages(partner.id)
      .then((res) => setMessages(res.data))
      .catch(() => {})
      .finally(() => setIsLoadingMessages(false));
  }, []);

  const handleSend = async () => {
    if (!activePartner || !messageInput.trim()) return;
    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    // Prefer WebSocket delivery; fall back to REST
    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', {
        receiverId: activePartner.id,
        content,
      });
    } else {
      try {
        const msg = await sendChatMessage(activePartner.id, content);
        setMessages((prev) => [msg, ...prev]);
      } catch {
        // silently fail
      }
    }

    setIsSending(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Conversations list */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-slate-100">
        <div className="border-b border-slate-100 px-4 py-4">
          <h2 className="text-lg font-bold text-slate-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingConvos ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No conversations yet.</p>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.user.id}
                type="button"
                onClick={() => openConversation(convo.user)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  activePartner?.id === convo.user.id ? 'bg-purple-50' : ''
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-violet-500 text-xs font-bold text-white">
                  {convo.user.firstName[0]}{convo.user.lastName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {convo.user.firstName} {convo.user.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-500">{convo.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Message thread */}
      <main className="flex flex-1 flex-col">
        {activePartner ? (
          <>
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-violet-500 text-xs font-bold text-white">
                {activePartner.firstName[0]}{activePartner.lastName[0]}
              </div>
              <span className="font-semibold text-slate-900">
                {activePartner.firstName} {activePartner.lastName}
              </span>
            </div>

            <div className="flex flex-1 flex-col-reverse overflow-y-auto px-6 py-4 space-y-2 space-y-reverse">
              <div ref={messagesEndRef} />
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-slate-400">No messages yet. Say hello!</p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.receiver.id === activePartner.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`mt-1 text-right text-xs ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Write a message…"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-100"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={isSending || !messageInput.trim()}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700">Select a conversation</h3>
            <p className="mt-1 text-sm text-slate-400">Choose from the left to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat;
