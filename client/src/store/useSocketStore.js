// store/useSocketStore.js
import { create } from "zustand";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: {},

  connect: (userId) => {
    const existing = get().socket;
    if (existing?.connected) {
      existing.emit("user:online", userId);
      return;
    }

    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[Socket] connected:", socket.id);
      socket.emit("user:online", userId);
    });
    socket.on("connect_error", (err) =>
      console.error("[Socket] error:", err.message),
    );

    socket.on("user:statusChange", ({ userId: uid, isOnline, lastSeen }) => {
      set((s) => ({
        onlineUsers: {
          ...s.onlineUsers,
          [uid]: {
            isOnline,
            lastSeen: lastSeen || s.onlineUsers[uid]?.lastSeen,
          },
        },
      }));
    });

    set({ socket });
  },

  seedOnlineStatus: (friends) => {
    const map = {};
    friends.forEach((f) => {
      map[f._id] = { isOnline: f.isOnline || false, lastSeen: f.lastSeen };
    });
    set((s) => ({ onlineUsers: { ...s.onlineUsers, ...map } }));
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, onlineUsers: {} });
  },
}));

export default useSocketStore;
