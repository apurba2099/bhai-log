// components/ChatWindow.jsx
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import useAuthStore from "../store/useAuthStore";
import useChatStore from "../store/useChatStore";
import useSocketStore from "../store/useSocketStore";
import useThemeStore from "../store/useThemeStore";
import api from "../utils/axios";
import { SERVER_URL } from "../utils/serverUrl";
import { formatMessageTime, formatLastSeen } from "../utils/timeHelpers";
import FileMessage from "./FileMessage";
import MediaModal from "./MediaModal";
import "./ChatWindow.css";

// Simple link renderer
function MsgText({ text }) {
  const URL_RE = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(URL_RE);
  return (
    <span className="msg-text">
      {parts.map((p, i) =>
        URL_RE.test(p) ? (
          <a
            key={i}
            href={p}
            target="_blank"
            rel="noopener noreferrer"
            className="msg-link"
          >
            {p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}

export default function ChatWindow({ onBack }) {
  const { user } = useAuthStore();
  const {
    activeChat,
    messages,
    loading,
    fetchMessages,
    addMessage,
    clearUnread,
    conversations,
  } = useChatStore();
  const { socket, onlineUsers } = useSocketStore();
  const { theme } = useThemeStore();

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [fileSizeError, setFileSizeError] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null); // { msgId, isMine, x, y }
  const fileRef = useRef();
  const endRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    if (!activeChat) return;
    const id = activeChat.isSelf ? user._id : activeChat._id;
    fetchMessages(id);
    const conv = conversations.find((c) =>
      c.participants?.some((p) => (p._id || p)?.toString() === id?.toString()),
    );
    if (conv) {
      clearUnread(conv._id);
      if (!activeChat.isSelf)
        socket?.emit("message:seen", {
          conversationId: conv._id,
          senderId: activeChat._id,
        });
    }
  }, [activeChat?._id]); // eslint-disable-line

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setCtxMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  if (!activeChat) {
    return (
      <div className="cw-empty">
        <div className="cw-empty-inner">
          <div className="cw-empty-icon">💬</div>
          <h2>Welcome to ChatApp</h2>
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const recipientId = activeChat.isSelf ? user._id : activeChat._id;
  const friendStatus = activeChat.isSelf
    ? null
    : onlineUsers[activeChat._id] || { isOnline: false };

  // New
  const headerDp = activeChat.profilePic
    ? activeChat.profilePic.startsWith("http")
      ? activeChat.profilePic
      : `${SERVER_URL}/${activeChat.profilePic}`
    : null;

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setFileSizeError(true);
      return;
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
  };
  const clearFile = () => {
    setFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const sendMessage = async () => {
    if ((!text.trim() && !file) || sending) return;
    setSending(true);
    const fd = new FormData();
    if (text.trim()) fd.append("text", text.trim());
    if (file) fd.append("file", file);
    try {
      const { data: msg } = await api.post(`/messages/${recipientId}`, fd);
      addMessage(msg);
      setText("");
      clearFile();
      setShowEmoji(false);
      if (!activeChat.isSelf)
        socket?.emit("message:send", {
          message: msg,
          recipientId: activeChat._id,
        });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDeleteForMe = async (msgId) => {
    try {
      await api.delete(`/messages/${msgId}/delete-for-me`);
      useChatStore.getState().removeMessage(msgId);
    } catch (err) {
      console.error(err);
    }
    setCtxMenu(null);
  };
  const handleDeleteForEveryone = async (msg) => {
    try {
      await api.delete(`/messages/${msg._id}/delete-for-everyone`);
      useChatStore.getState().markMessageDeleted(msg._id);
      socket?.emit("message:deleteForEveryone", {
        messageId: msg._id,
        recipientId: activeChat._id,
        conversationId: msg.conversationId,
      });
    } catch (err) {
      console.error(err);
    }
    setCtxMenu(null);
  };

  const openCtxMenu = (e, msg, isMine) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ msg, isMine, x: e.clientX, y: e.clientY });
  };

  const getFileIcon = (f) => {
    if (!f) return "📎";
    if (f.type.startsWith("image/")) return "🖼️";
    if (f.type.startsWith("video/")) return "🎬";
    if (f.type === "application/pdf") return "📄";
    return "📝";
  };

  // Tick component
  const Ticks = ({ status }) => {
    if (status === "sent")
      return (
        <span className="ticks grey" title="Sent">
          ✓
        </span>
      );
    if (status === "delivered")
      return (
        <span className="ticks grey" title="Delivered">
          ✓✓
        </span>
      );
    if (status === "seen")
      return (
        <span className="ticks blue" title="Seen">
          ✓✓
        </span>
      );
    return null;
  };

  return (
    <div className="chat-window" onClick={() => setCtxMenu(null)}>
      {/* ── HEADER ── */}
      <div className="cw-header">
        <button className="cw-back-btn" onClick={onBack} aria-label="Back">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="cw-header-dp">
          {headerDp ? (
            <img src={headerDp} alt="dp" className="cw-header-dp-img" />
          ) : (
            <div className="cw-header-dp-ph">
              {activeChat.isSelf
                ? "🔒"
                : activeChat.fullName?.[0]?.toUpperCase()}
            </div>
          )}
          {!activeChat.isSelf && friendStatus?.isOnline && (
            <span className="cw-header-dot" />
          )}
        </div>
        <div className="cw-header-info">
          <span className="cw-header-name">
            {activeChat.isSelf ? "Open Locker" : activeChat.fullName}
          </span>
          <span className="cw-header-status">
            {activeChat.isSelf
              ? "Your private space"
              : friendStatus?.isOnline
                ? "● Online"
                : formatLastSeen(friendStatus?.lastSeen)}
          </span>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div className="cw-messages">
        {loading && (
          <div className="cw-loading">
            <span className="spinner" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="cw-no-msgs">
            <span>👋</span>
            <p>No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map((msg) => {
          const senderId =
            typeof msg.sender === "object" ? msg.sender?._id : msg.sender;
          const isMine = senderId?.toString() === user._id?.toString();

          if (msg.deletedForEveryone) {
            return (
              <div
                key={msg._id}
                className={`msg-row ${isMine ? "mine" : "theirs"}`}
              >
                <div className="bubble deleted">
                  🚫 This message was deleted
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg._id}
              className={`msg-row ${isMine ? "mine" : "theirs"}`}
              onContextMenu={(e) => openCtxMenu(e, msg, isMine)}
              onLongPress={(e) => openCtxMenu(e, msg, isMine)}
            >
              <div className={`bubble ${isMine ? "mine" : "theirs"}`}>
                {msg.fileUrl && msg.fileType !== "none" && (
                  <FileMessage
                    fileUrl={
                      msg.fileUrl.startsWith("http")
                        ? msg.fileUrl
                        : `${SERVER_URL}/${msg.fileUrl}`
                    }
                    fileType={msg.fileType}
                    fileName={msg.fileName}
                    onClick={() =>
                      ["image", "video"].includes(msg.fileType)
                        ? setPreviewMedia({
                            url: msg.fileUrl.startsWith("http")
                              ? msg.fileUrl
                              : `${SERVER_URL}/${msg.fileUrl}`,
                            type: msg.fileType,
                          })
                        : null
                    }
                  />
                )}
                {msg.text && <MsgText text={msg.text} />}
                <div className="msg-footer">
                  <span className="msg-time">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                  {isMine && <Ticks status={msg.status} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* ── CONTEXT MENU ── */}
      {ctxMenu && (
        <div
          className="ctx-menu"
          style={{
            top: Math.min(ctxMenu.y, window.innerHeight - 100),
            left: Math.min(ctxMenu.x, window.innerWidth - 180),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {ctxMenu.isMine && (
            <button onClick={() => handleDeleteForEveryone(ctxMenu.msg)}>
              🗑️ Delete for everyone
            </button>
          )}
          <button onClick={() => handleDeleteForMe(ctxMenu.msg._id)}>
            Delete for me
          </button>
        </div>
      )}

      {/* ── FILE PREVIEW ── */}
      {file && (
        <div className="cw-file-preview">
          <span>{getFileIcon(file)}</span>
          <span className="cw-file-name">{file.name}</span>
          <button onClick={clearFile}>✕</button>
        </div>
      )}

      {/* ── EMOJI PICKER ── */}
      {showEmoji && (
        <div className="cw-emoji-wrap" onClick={(e) => e.stopPropagation()}>
          <EmojiPicker
            onEmojiClick={(e) => setText((p) => p + e.emoji)}
            theme={theme === "dark" ? "dark" : "light"}
            height={320}
            searchDisabled
            skinTonesDisabled
          />
        </div>
      )}

      {/* ── INPUT BAR ── */}
      <div className="cw-input-bar">
        <button className="cw-icon-btn" onClick={() => setShowEmoji((v) => !v)}>
          😊
        </button>
        <button className="cw-icon-btn" onClick={() => fileRef.current.click()}>
          📎
        </button>
        <input
          type="file"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          accept="image/*,video/mp4,video/webm,application/pdf,text/plain"
        />
        <textarea
          ref={inputRef}
          className="cw-input"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="cw-send-btn"
          onClick={sendMessage}
          disabled={sending}
        >
          {sending ? (
            <span className="spinner-sm" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* ── FILE SIZE ERROR ── */}
      {fileSizeError && (
        <div
          className="cw-modal-overlay"
          onClick={() => setFileSizeError(false)}
        >
          <div className="cw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cw-modal-icon">⚠️</div>
            <h3>File Too Large</h3>
            <p>Files must be ≤ 10MB. Please choose a smaller file.</p>
            <button
              className="cw-modal-btn"
              onClick={() => setFileSizeError(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {previewMedia && (
        <MediaModal
          media={previewMedia}
          onClose={() => setPreviewMedia(null)}
        />
      )}
    </div>
  );
}
