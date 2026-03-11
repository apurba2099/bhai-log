// pages/Home.jsx
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import useAuthStore from '../store/useAuthStore'
import useSocketStore from '../store/useSocketStore'
import useChatStore from '../store/useChatStore'
import './Home.css'

export default function Home() {
  const { user } = useAuthStore()
  const { socket, connect } = useSocketStore()
  const { addMessage, updateMessageStatus, markAllSeen, markMessageDeleted, setUnread, fetchConversations } = useChatStore()
  const [mobileChatOpen, setMobileChatOpen] = useState(false)

  useEffect(() => {
    if (user && !socket) connect(user._id)
  }, [user, socket, connect])

  useEffect(() => {
    if (!socket) return
    socket.on('message:receive', (msg) => { addMessage(msg); fetchConversations() })
    socket.on('message:statusUpdate', ({ messageId, status }) => updateMessageStatus(messageId, status))
    socket.on('message:allSeen', ({ conversationId }) => markAllSeen(conversationId))
    socket.on('message:deleted', ({ messageId }) => markMessageDeleted(messageId))
    socket.on('notification:unread', ({ conversationId, count }) => setUnread(conversationId, count))
    return () => {
      socket.off('message:receive')
      socket.off('message:statusUpdate')
      socket.off('message:allSeen')
      socket.off('message:deleted')
      socket.off('notification:unread')
    }
  }, [socket]) // eslint-disable-line

  return (
    <div className="home-layout">
      <div className={`home-sidebar ${mobileChatOpen ? 'slide-out' : ''}`}>
        <Sidebar onSelectChat={() => setMobileChatOpen(true)} />
      </div>
      <div className={`home-chat ${!mobileChatOpen ? 'slide-out' : ''}`}>
        <ChatWindow onBack={() => setMobileChatOpen(false)} />
      </div>
    </div>
  )
}
