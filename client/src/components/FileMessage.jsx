// components/FileMessage.jsx
import './FileMessage.css'

export default function FileMessage({ fileUrl, fileType, fileName, onClick }) {
  if (fileType === 'image') return (
    <div className="fm-img-wrap" onClick={onClick}>
      <img src={fileUrl} alt={fileName} className="fm-img" loading="lazy" />
      <div className="fm-img-overlay"><span>🔍</span></div>
    </div>
  )
  if (fileType === 'video') return (
    <div className="fm-video-wrap" onClick={onClick}>
      <video className="fm-video"><source src={fileUrl} /></video>
      <div className="fm-play">▶</div>
    </div>
  )
  if (fileType === 'pdf') return (
    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="fm-doc">
      <span className="fm-doc-icon">📄</span>
      <span className="fm-doc-name">{fileName || 'PDF Document'}</span>
      <span className="fm-doc-arrow">↗</span>
    </a>
  )
  if (fileType === 'text') return (
    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="fm-doc">
      <span className="fm-doc-icon">📝</span>
      <span className="fm-doc-name">{fileName || 'Text File'}</span>
      <span className="fm-doc-arrow">↗</span>
    </a>
  )
  return null
}
