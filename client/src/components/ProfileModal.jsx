// components/ProfileModal.jsx
import { useEffect, useRef, useState } from "react";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import api from "../utils/axios";
import { SERVER_URL } from "../utils/serverUrl";
import { formatJoinDate } from "../utils/timeHelpers";
import "./ProfileModal.css";

export default function ProfileModal({ onClose }) {
  const { user, updateUser, logout } = useAuthStore();
  const { socket, disconnect } = useSocketStore();

  const [fullUser, setFullUser] = useState(null);
  const [about, setAbout] = useState(user?.about || "");
  const [editingAbout, setEditingAbout] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDpFull, setShowDpFull] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api
      .get("/users/profile")
      .then(({ data }) => {
        setFullUser(data);
        setAbout(data.about || "");
        updateUser({ createdAt: data.createdAt, about: data.about });
      })
      .catch(console.error);
  }, []); // eslint-disable-line

  const display = fullUser || user;

  // NEW
  const dp = display?.profilePic
    ? display.profilePic.startsWith("http")
      ? display.profilePic
      : `${SERVER_URL}/${display.profilePic}`
    : null;

  const handleDpChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("Photo must be under 5MB");
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append("profilePic", f);
    try {
      const { data } = await api.post("/users/upload-dp", form);
      updateUser({ profilePic: data.profilePic });
      setFullUser((p) => ({ ...p, profilePic: data.profilePic }));
    } catch (err) {
      alert("Upload failed. Try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDp = async () => {
    try {
      await api.delete("/users/remove-dp");
      updateUser({ profilePic: "" });
      setFullUser((p) => ({ ...p, profilePic: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAbout = async () => {
    try {
      await api.put("/users/profile", { about });
      updateUser({ about });
      setFullUser((p) => ({ ...p, about }));
      setEditingAbout(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "delete") return;
    try {
      const { data } = await api.get("/users/friends");
      const friendIds = (data.friends || []).map((f) => f._id);
      await api.delete("/users/delete-account");
      socket?.emit("account:deleted", { friendIds });
      disconnect();
      logout();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose}>
          ✕
        </button>

        {/* DP section */}
        <div className="pm-dp-section">
          <div className="pm-dp-wrap" onClick={() => dp && setShowDpFull(true)}>
            {dp ? (
              <img src={dp} alt="profile" className="pm-dp" />
            ) : (
              <div className="pm-dp-ph">
                {display?.fullName?.[0]?.toUpperCase()}
              </div>
            )}
            {uploading && (
              <div className="pm-dp-loading">
                <span className="spinner" />
              </div>
            )}
          </div>
          <div className="pm-dp-actions">
            <button
              className="pm-dp-btn"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
            >
              {dp ? "📷 Change" : "📷 Add Photo"}
            </button>
            {dp && (
              <button className="pm-dp-btn danger" onClick={handleRemoveDp}>
                Remove
              </button>
            )}
          </div>
          <input
            type="file"
            ref={fileRef}
            style={{ display: "none" }}
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleDpChange}
          />
        </div>

        {/* User info */}
        <div className="pm-info">
          <h2 className="pm-name">{display?.fullName}</h2>
          <p className="pm-uid">@{display?.userId}</p>
          <p className="pm-joined">
            📅 Joined{" "}
            {display?.createdAt ? formatJoinDate(display.createdAt) : "…"}
          </p>
        </div>

        {/* About */}
        <div className="pm-about">
          <label className="pm-label">About</label>
          {editingAbout ? (
            <div>
              <textarea
                className="pm-textarea"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={3}
                maxLength={150}
                placeholder="Write something about yourself…"
              />
              <div className="pm-about-btns">
                <button className="pm-btn primary" onClick={handleSaveAbout}>
                  Save
                </button>
                <button
                  className="pm-btn ghost"
                  onClick={() => {
                    setAbout(display?.about || "");
                    setEditingAbout(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="pm-about-display"
              onClick={() => setEditingAbout(true)}
            >
              <p>{about || "Tap to add about…"}</p>
              <span>✏️</span>
            </div>
          )}
        </div>

        {/* Mobile logout — shown only on mobile */}
        <button className="pm-logout-mobile" onClick={logout}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Logout
        </button>

        {/* Delete account */}
        <button
          className="pm-delete-btn"
          onClick={() => setShowDeleteModal(true)}
        >
          🗑️ Delete Account
        </button>
      </div>

      {/* Full DP */}
      {showDpFull && (
        <div
          className="pm-overlay dp-full"
          onClick={() => setShowDpFull(false)}
        >
          <img
            src={dp}
            alt="full dp"
            className="pm-full-dp"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="pm-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="pm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚠️</div>
            <h3>Delete Account</h3>
            <p>
              This permanently deletes your account, all messages, and
              conversations. This <strong>cannot</strong> be undone.
            </p>
            <p className="pm-delete-hint">
              Type <strong>delete</strong> to confirm:
            </p>
            <input
              className="pm-delete-input"
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="delete"
              autoFocus
            />
            <div className="pm-delete-actions">
              <button
                className="pm-btn danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "delete"}
              >
                Delete Forever
              </button>
              <button
                className="pm-btn ghost"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
