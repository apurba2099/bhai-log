// components/FriendProfileModal.jsx
import { useEffect, useState } from 'react'
import useSocketStore from '../store/useSocketStore'
import api from '../utils/axios'
import { SERVER_URL } from '../utils/serverUrl'
import { formatLastSeen, formatJoinDate } from '../utils/timeHelpers'
import './FriendProfileModal.css'

export default function FriendProfileModal({ friend, onClose, onChat }) {
  const { onlineUsers } = useSocketStore()
  const [profile, setProfile] = useState(friend)
  const [showDpFull, setShowDpFull] = useState(false)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/users/${friend._id}`)
      .then(({ data }) => { setProfile(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [friend._id])

  const status = onlineUsers[friend._id] || { isOnline: profile?.isOnline || false, lastSeen: profile?.lastSeen }
  const dp = profile?.profilePic ? `${SERVER_URL}/${profile.profilePic}` : null

  const handleRemoveFriend = async () => {
    if (!window.confirm(`Remove ${profile.fullName} from friends?`)) return
    setRemoving(true)
    try { await api.delete(`/users/remove-friend/${profile._id}`); onClose(); window.location.reload() }
    catch (err) { console.error(err); setRemoving(false) }
  }

  return (
    <div className="fpm-overlay" onClick={onClose}>
      <div className="fpm-modal" onClick={e => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose}>✕</button>

        <div className="fpm-dp-wrap" onClick={() => dp && setShowDpFull(true)}>
          {dp ? <img src={dp} alt="dp" className="fpm-dp" />
              : <div className="fpm-dp-ph">{profile?.fullName?.[0]?.toUpperCase()}</div>}
        </div>

        <div className="fpm-status">
          <span className={`fpm-dot ${status.isOnline ? 'online' : 'offline'}`} />
          <span className="fpm-status-text">{status.isOnline ? 'Online now' : formatLastSeen(status.lastSeen)}</span>
        </div>

        {loading
          ? <p className="fpm-loading">Loading…</p>
          : <>
              <h2 className="fpm-name">{profile?.fullName}</h2>
              <p className="fpm-uid">@{profile?.userId}</p>
              <p className="fpm-joined">📅 Joined {profile?.createdAt ? formatJoinDate(profile.createdAt) : 'Unknown'}</p>
              <div className="fpm-about">
                <label>About</label>
                <p>{profile?.about || 'No about yet.'}</p>
              </div>
            </>}

        <div className="fpm-actions">
          <button className="pm-btn primary" onClick={onChat}>💬 Send Message</button>
          <button className="pm-btn ghost danger-border" onClick={handleRemoveFriend} disabled={removing}>
            {removing ? 'Removing…' : 'Remove Friend'}
          </button>
        </div>
      </div>

      {showDpFull && (
        <div className="fpm-overlay dp-full" onClick={() => setShowDpFull(false)}>
          <img src={dp} alt="full dp" className="pm-full-dp" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
