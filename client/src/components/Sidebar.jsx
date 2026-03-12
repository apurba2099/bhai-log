// components/Sidebar.jsx
import { useEffect, useState, useCallback } from "react";
import useAuthStore from "../store/useAuthStore";
import useChatStore from "../store/useChatStore";
import useSocketStore from "../store/useSocketStore";
import useThemeStore from "../store/useThemeStore";
import api from "../utils/axios";
import { SERVER_URL } from "../utils/serverUrl";
import { formatLastSeen } from "../utils/timeHelpers";
import ProfileModal from "./ProfileModal";
import FriendProfileModal from "./FriendProfileModal";
import "./Sidebar.css";

export default function Sidebar({ onSelectChat }) {
  const { user, logout } = useAuthStore();
  const { conversations, unreadCounts, fetchConversations, setActiveChat } =
    useChatStore();
  const { socket, onlineUsers, seedOnlineStatus } = useSocketStore();
  const { theme, toggle } = useThemeStore();

  const [tab, setTab] = useState("chats");
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [viewingFriend, setViewingFriend] = useState(null);

  const loadFriends = useCallback(async () => {
    try {
      const { data } = await api.get("/users/friends");
      const fl = data.friends || [];
      setFriends(fl);
      setFriendRequests(data.friendRequests || []);
      setSentRequests(data.sentRequests || []);
      seedOnlineStatus(fl);
    } catch (err) {
      console.error(err);
    }
  }, [seedOnlineStatus]);

  useEffect(() => {
    fetchConversations();
    loadFriends();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      loadFriends();
      fetchConversations();
    };
    const onDeleted = ({ userId }) => {
      setFriends((p) => p.filter((f) => f._id !== userId));
      fetchConversations();
    };
    socket.on("friend:newRequest", refresh);
    socket.on("friend:accepted", refresh);
    socket.on("friend:accountDeleted", onDeleted);
    return () => {
      socket.off("friend:newRequest", refresh);
      socket.off("friend:accepted", refresh);
      socket.off("friend:accountDeleted", onDeleted);
    };
  }, [socket, loadFriends, fetchConversations]);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get(
        `/users/search?q=${encodeURIComponent(q)}`,
      );
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openChat = (chatUser) => {
    setActiveChat(chatUser);
    onSelectChat();
  };
  const openLocker = () => {
    setActiveChat({ ...user, isSelf: true });
    onSelectChat();
  };

  const sendRequest = async (id) => {
    try {
      await api.post(`/users/friend-request/${id}`);
      socket?.emit("friend:requestSent", { toUserId: id, fromUser: user });
      setSentRequests((p) => [...p, { _id: id }]);
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };
  const acceptRequest = async (id) => {
    try {
      await api.post(`/users/accept-request/${id}`);
      socket?.emit("friend:requestAccepted", { toUserId: id, byUser: user });
      loadFriends();
      fetchConversations();
    } catch {}
  };
  const declineRequest = async (id) => {
    try {
      await api.post(`/users/decline-request/${id}`);
      loadFriends();
    } catch {}
  };

  const getStatus = (id) => onlineUsers[id] || { isOnline: false };

  // New
  const dp = (pic) =>
    pic ? (pic.startsWith("http") ? pic : `${SERVER_URL}/${pic}`) : null;

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="sidebar">
      {/* ── HEADER ── */}
      <div className="sidebar-header">
        <button
          className="sidebar-avatar-btn"
          onClick={() => setShowProfile(true)}
        >
          <div className="sb-dp-wrap">
            {dp(user?.profilePic) ? (
              <img src={dp(user.profilePic)} alt="dp" className="sb-dp" />
            ) : (
              <div className="sb-dp-placeholder">
                {user?.fullName?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="sb-online-dot" />
          </div>
          <div className="sb-user-info">
            <span className="sb-name">{user?.fullName}</span>
            <span className="sb-uid">@{user?.userId}</span>
          </div>
        </button>

        <div className="sb-header-actions">
          {/* Theme toggle — always visible */}
          <button className="sb-icon-btn" onClick={toggle} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          {/* Logout — hidden on mobile, shown on desktop */}
          <button
            className="sb-icon-btn sb-logout-desktop"
            onClick={logout}
            title="Logout"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="sb-search">
        <div className="sb-search-wrap">
          <span className="sb-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search users by UserID…"
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchQuery && (
            <button
              className="sb-search-clear"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── SEARCH RESULTS ── */}
      {searchQuery && (
        <div className="sb-search-results">
          {searchResults.length === 0 ? (
            <p className="sb-empty">No users found for "{searchQuery}"</p>
          ) : (
            searchResults.map((u) => {
              const isFriend = friends.some((f) => f._id === u._id);
              const hasSent = sentRequests.some((r) => r._id === u._id);
              const hasIncoming = friendRequests.some((r) => r._id === u._id);
              return (
                <div key={u._id} className="sb-result-item">
                  {dp(u.profilePic) ? (
                    <img
                      src={dp(u.profilePic)}
                      className="sb-result-dp"
                      alt=""
                    />
                  ) : (
                    <div className="sb-result-dp-ph">{u.fullName[0]}</div>
                  )}
                  <div className="sb-result-info">
                    <span className="sb-result-name">{u.fullName}</span>
                    <span className="sb-result-uid">@{u.userId}</span>
                  </div>
                  <div>
                    {isFriend ? (
                      <button
                        className="pill-btn green"
                        onClick={() => {
                          openChat(u);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                      >
                        Chat
                      </button>
                    ) : hasSent ? (
                      <span className="pill-label">Sent</span>
                    ) : hasIncoming ? (
                      <button
                        className="pill-btn green"
                        onClick={() => acceptRequest(u._id)}
                      >
                        Accept
                      </button>
                    ) : (
                      <button
                        className="pill-btn purple"
                        onClick={() => sendRequest(u._id)}
                      >
                        Add +
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TABS ── */}
      <div className="sb-tabs">
        <button
          className={`sb-tab ${tab === "chats" ? "active" : ""}`}
          onClick={() => setTab("chats")}
        >
          Chats
          {totalUnread > 0 && (
            <span className="sb-tab-badge">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </button>
        <button
          className={`sb-tab ${tab === "friends" ? "active" : ""}`}
          onClick={() => setTab("friends")}
        >
          Friends
          {friendRequests.length > 0 && (
            <span className="sb-tab-badge">{friendRequests.length}</span>
          )}
        </button>
      </div>

      {/* ── LIST ── */}
      <div className="sb-list">
        {/* CHATS TAB */}
        {tab === "chats" && (
          <>
            {/* Open Locker */}
            <div className="sb-chat-item locker" onClick={openLocker}>
              <div className="sb-item-dp locker-dp">🔒</div>
              <div className="sb-item-info">
                <span className="sb-item-name">Open Locker</span>
                <span className="sb-item-preview">Your private space</span>
              </div>
            </div>

            {conversations
              .filter((c) => c.participants?.length >= 2)
              .map((conv) => {
                const partner = conv.participants?.find(
                  (p) => (p._id || p)?.toString() !== user._id?.toString(),
                );
                if (!partner?._id) return null;
                const status = getStatus(partner._id);
                const unread = unreadCounts[conv._id] || 0;
                const lm = conv.lastMessage;
                let preview = "";
                if (lm) {
                  if (lm.deletedForEveryone) preview = "🚫 Deleted message";
                  else if (lm.text) preview = lm.text;
                  else if (lm.fileType && lm.fileType !== "none") {
                    const icons = {
                      image: "🖼️",
                      video: "🎬",
                      pdf: "📄",
                      text: "📝",
                    };
                    preview = `${icons[lm.fileType] || "📎"} ${lm.fileName || "File"}`;
                  }
                }
                return (
                  <div
                    key={conv._id}
                    className="sb-chat-item"
                    onClick={() => openChat(partner)}
                  >
                    <div
                      className="sb-dp-wrap-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingFriend(partner);
                      }}
                    >
                      {dp(partner.profilePic) ? (
                        <img
                          src={dp(partner.profilePic)}
                          className="sb-dp-sm"
                          alt=""
                        />
                      ) : (
                        <div className="sb-dp-ph">
                          {partner.fullName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      {status.isOnline && <span className="sb-dot-online" />}
                    </div>
                    <div className="sb-item-info">
                      <span className="sb-item-name">{partner.fullName}</span>
                      <span className="sb-item-preview">{preview}</span>
                    </div>
                    {unread > 0 && (
                      <span className="sb-unread">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                );
              })}

            {conversations.filter((c) => c.participants?.length >= 2).length ===
              0 && (
              <p className="sb-empty" style={{ padding: "20px 16px" }}>
                No chats yet. Add a friend to start!
              </p>
            )}
          </>
        )}

        {/* FRIENDS TAB */}
        {tab === "friends" && (
          <>
            {friendRequests.length > 0 && (
              <div className="sb-requests">
                <p className="sb-section-label">
                  Requests ({friendRequests.length})
                </p>
                {friendRequests.map((u) => (
                  <div key={u._id} className="sb-request-item">
                    <div className="sb-req-dp">
                      {u.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div className="sb-req-info">
                      <span className="sb-req-name">{u.fullName}</span>
                      <span className="sb-req-uid">@{u.userId}</span>
                    </div>
                    <div className="sb-req-actions">
                      <button
                        className="pill-btn green sm"
                        onClick={() => acceptRequest(u._id)}
                      >
                        ✓
                      </button>
                      <button
                        className="pill-btn red sm"
                        onClick={() => declineRequest(u._id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="sb-section-label">Friends ({friends.length})</p>
            {friends.length === 0 ? (
              <p className="sb-empty">No friends yet. Search to add someone!</p>
            ) : (
              friends.map((f) => {
                const status = getStatus(f._id);
                return (
                  <div
                    key={f._id}
                    className="sb-chat-item"
                    onClick={() => openChat(f)}
                  >
                    <div
                      className="sb-dp-wrap-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingFriend(f);
                      }}
                    >
                      {dp(f.profilePic) ? (
                        <img
                          src={dp(f.profilePic)}
                          className="sb-dp-sm"
                          alt=""
                        />
                      ) : (
                        <div className="sb-dp-ph">
                          {f.fullName[0]?.toUpperCase()}
                        </div>
                      )}
                      {status.isOnline && <span className="sb-dot-online" />}
                    </div>
                    <div className="sb-item-info">
                      <span className="sb-item-name">{f.fullName}</span>
                      <span
                        className={`sb-item-preview ${status.isOnline ? "online-text" : ""}`}
                      >
                        {status.isOnline
                          ? "● Online"
                          : formatLastSeen(status.lastSeen)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="sb-footer">
        © All Rights Reserved | Built by Apurba Dutta
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {viewingFriend && (
        <FriendProfileModal
          friend={viewingFriend}
          onClose={() => setViewingFriend(null)}
          onChat={() => {
            openChat(viewingFriend);
            setViewingFriend(null);
          }}
        />
      )}
    </div>
  );
}
