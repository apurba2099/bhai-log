// components/MediaModal.jsx
import './MediaModal.css'

export default function MediaModal({ media, onClose }) {
  return (
    <div className="mm-overlay" onClick={onClose}>
      <button className="mm-close" onClick={onClose}>✕</button>
      <div className="mm-content" onClick={e => e.stopPropagation()}>
        {media.type === 'image'
          ? <img src={media.url} alt="preview" className="mm-img" />
          : <video src={media.url} controls autoPlay className="mm-video" />}
      </div>
    </div>
  )
}
