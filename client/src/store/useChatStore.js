// store/useChatStore.js
import { create } from 'zustand';
import api from '../utils/axios';

const useChatStore = create((set, get) => ({
  conversations: [],
  messages: [],
  activeChat: null,
  unreadCounts: {},
  loading: false,

  fetchConversations: async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      const counts = {};
      data.forEach((c) => { counts[c._id] = c.myUnread || 0; });
      set({ conversations: data, unreadCounts: counts });
    } catch (err) { console.error('fetchConversations:', err); }
  },

  fetchMessages: async (friendId) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/messages/${friendId}`);
      set({ messages: data, loading: false });
    } catch { set({ loading: false }); }
  },

  setActiveChat: (user) => set({ activeChat: user }),

  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),

  updateMessageStatus: (messageId, status) =>
    set((s) => ({ messages: s.messages.map((m) => m._id === messageId ? { ...m, status } : m) })),

  markAllSeen: (conversationId) =>
    set((s) => ({ messages: s.messages.map((m) => m.conversationId === conversationId ? { ...m, status: 'seen' } : m) })),

  markMessageDeleted: (messageId) =>
    set((s) => ({ messages: s.messages.map((m) => m._id === messageId ? { ...m, deletedForEveryone: true, text: '', fileUrl: '' } : m) })),

  removeMessage: (messageId) =>
    set((s) => ({ messages: s.messages.filter((m) => m._id !== messageId) })),

  setUnread: (conversationId, count) =>
    set((s) => ({ unreadCounts: { ...s.unreadCounts, [conversationId]: count } })),

  clearUnread: (conversationId) =>
    set((s) => ({ unreadCounts: { ...s.unreadCounts, [conversationId]: 0 } })),
}));

export default useChatStore;
