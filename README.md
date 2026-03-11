# 💬 ChatApp — Real-Time Friend-Based Chat

A production-ready MERN stack chat application with Socket.io real-time messaging.

**Built by Apurba Dutta**

---

## 🗂️ Project Structure

```
chatapp/
├── client/          # React frontend
└── server/          # Node.js + Express backend
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

---

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd chatapp

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

---

### 2. Configure Environment

**Server** (`server/.env`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_very_secret_key_change_this
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Client** (`client/.env`):
```env
REACT_APP_SERVER_URL=http://localhost:5000
```

---

### 3. Run the App

Open two terminals:

```bash
# Terminal 1 — Start backend
cd server
npm run dev

# Terminal 2 — Start frontend
cd client
npm start
```

Visit **http://localhost:3000**

---

## ✅ Features

### Auth
- Register: Full Name, UserID, Password, Confirm Password, Pet Name (secret Q)
- Login: UserID + Password (JWT stored in localStorage)
- Forgot Password: UserID → Pet Name → Reset Password

### Messaging
- Text, Emoji, Photos (≤10MB), Videos (≤10MB), PDFs, Text files
- File size exceeded → modal popup
- Click photo/video → fullscreen modal viewer
- Delete for Me / Delete for Everyone
- "This message was deleted" placeholder shown after deletion
- Message send time shown below each bubble

### Real-Time (Socket.io)
- Live message delivery without page refresh
- Online status: green dot when online
- Offline: "Last seen X minutes/hours ago"
- Message ticks: ✓ sent · ✓✓ delivered · ✓✓ seen (blue)
- Unread badge on conversations (10+)
- Real-time badge clear when conversation opened

### Friends System
- Search users by UserID
- Send / Accept / Decline friend requests
- Remove friend
- View friend's profile modal (DP, about, status, joined date)

### Profile
- Upload / Change / Remove profile picture
- Click DP → full screen modal view
- Edit "About" bio
- View joined date
- Delete Account (type "delete" to confirm) → real-time removal from friends' lists

### Self-Message ("Open Locker")
- Chat with yourself for notes
- Same features as friend chat

### Responsive
- Mobile-first design
- Sidebar hidden on mobile when chat is open, back button to return

---

## 📡 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `user:online` | Client → Server | User connects, marks online |
| `user:statusChange` | Server → All | Broadcast online/offline change |
| `message:send` | Client → Server | Deliver message to recipient |
| `message:receive` | Server → Client | Incoming message |
| `message:statusUpdate` | Server → Sender | Tick update (delivered) |
| `message:seen` | Client → Server | Viewer opened conversation |
| `message:allSeen` | Server → Sender | Blue ticks for all messages |
| `message:deleteForEveryone` | Client → Server | Relay deletion to recipient |
| `message:deleted` | Server → Recipient | Remove message from UI |
| `notification:unread` | Server → Recipient | Unread count badge update |
| `friend:requestSent` | Client → Server | Notify recipient of request |
| `friend:newRequest` | Server → Recipient | New friend request received |
| `friend:requestAccepted` | Client → Server | Notify sender of acceptance |
| `friend:accepted` | Server → Sender | Friend request was accepted |
| `account:deleted` | Client → Server | Notify friends of deletion |
| `friend:accountDeleted` | Server → Friends | Remove deleted user from UI |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, React Router, plain CSS |
| State | Zustand |
| Real-time | Socket.io-client |
| HTTP | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| Real-time Server | Socket.io |

---

## 📁 Key Folders

```
server/
├── config/db.js              # MongoDB connection
├── controllers/
│   ├── authController.js     # Register, login, password reset
│   ├── userController.js     # Profile, friends, search
│   └── messageController.js  # Send, fetch, delete messages
├── middleware/
│   ├── authMiddleware.js     # JWT verify
│   └── errorHandler.js       # Global error handler
├── models/
│   ├── User.js               # User schema
│   ├── Message.js            # Message schema
│   └── Conversation.js       # Conversation schema
├── routes/                   # Express routers
├── socket/socketManager.js   # All Socket.io logic
├── utils/
│   ├── generateToken.js      # JWT generator
│   └── multer.js             # File upload config
└── server.js                 # Entry point

client/src/
├── components/
│   ├── Sidebar.jsx/.css      # Friends list, search, tabs
│   ├── ChatWindow.jsx/.css   # Message area, input bar
│   ├── ChatBubble.jsx/.css   # Text bubble with link detection
│   ├── FileMessage.jsx/.css  # Image/video/pdf/text renderer
│   ├── MediaModal.jsx/.css   # Fullscreen media viewer
│   ├── ProfileModal.jsx/.css # Own profile management
│   └── FriendProfileModal.jsx/.css # Friend's profile view
├── pages/
│   ├── Login.jsx/.css        # Login form
│   ├── Register.jsx/.css     # Registration form
│   ├── ForgotPassword.jsx    # Password recovery
│   └── Home.jsx/.css         # Main layout
├── store/
│   ├── useAuthStore.js       # Auth state (Zustand)
│   ├── useChatStore.js       # Chat/messages state
│   └── useSocketStore.js     # Socket connection state
└── utils/
    ├── axios.js              # Axios with auth interceptor
    └── timeHelpers.js        # Time formatting utilities
```

---

© All Rights Reserved | Built by Apurba Dutta
