# 💬 BhaiLog — Real-Time Chat Application

A full-stack real-time chat application built with the MERN stack, Socket.io, and Vite. Features friend-based messaging, file sharing via Cloudinary, dark/light mode, and mobile-responsive design.

**Live Demo:** [bhai-log.vercel.app](https://bhai-log.vercel.app)

---

## ⚡ Tech Stack

### Frontend
- **React 18** + **Vite 5** — fast dev server and build
- **Zustand** — lightweight state management
- **Socket.io-client** — real-time communication
- **Axios** — HTTP requests with JWT interceptor
- **emoji-picker-react** — emoji support in chat

### Backend
- **Node.js** + **Express.js** — REST API
- **Socket.io** — real-time bidirectional events
- **MongoDB** + **Mongoose** — database
- **JWT** + **bcryptjs** — authentication
- **Multer** + **Cloudinary** — file uploads (permanent cloud storage)

### Deployment
- **Vercel** — frontend hosting
- **Render** — backend hosting
- **MongoDB Atlas** — cloud database
- **Cloudinary** — file/media storage

---

## 📁 Project Structure

```
bhai-log/
├── client/                          # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                 # Entry point
│       ├── App.jsx                  # Routes + Theme provider
│       ├── index.css                # Global styles + CSS variables (dark/light)
│       ├── components/
│       │   ├── Sidebar.jsx/.css     # Friends list, search, tabs, unread badges
│       │   ├── ChatWindow.jsx/.css  # Message area, input bar, emoji picker
│       │   ├── ChatBubble.jsx/.css  # Text bubble with link detection
│       │   ├── FileMessage.jsx/.css # Image/video/pdf/text file renderer
│       │   ├── MediaModal.jsx/.css  # Fullscreen media viewer
│       │   ├── ProfileModal.jsx/.css       # Own profile management
│       │   └── FriendProfileModal.jsx/.css # Friend profile viewer
│       ├── pages/
│       │   ├── Login.jsx            # Login page
│       │   ├── Register.jsx         # Register page
│       │   ├── ForgotPassword.jsx   # 2-step password recovery
│       │   ├── Home.jsx/.css        # Main layout (sidebar + chat)
│       │   └── Auth.css             # Shared auth page styles
│       ├── store/
│       │   ├── useAuthStore.js      # Auth state: user, token, login/logout
│       │   ├── useChatStore.js      # Chat state: conversations, messages
│       │   ├── useSocketStore.js    # Socket state: connection, online users
│       │   └── useThemeStore.js     # Dark/light theme persistence
│       └── utils/
│           ├── axios.js             # Axios instance with JWT interceptor
│           ├── serverUrl.js         # Smart server URL detection (LAN/prod)
│           └── timeHelpers.js       # formatMessageTime, formatLastSeen, formatJoinDate
│
└── server/                          # Node.js + Express backend
    ├── server.js                    # Entry point
    ├── package.json
    ├── .env.example
    ├── .gitignore
    ├── config/
    │   ├── db.js                    # MongoDB connection with retry logic
    │   └── cloudinary.js            # Cloudinary configuration
    ├── controllers/
    │   ├── authController.js        # register, login, forgot/reset password
    │   ├── userController.js        # profile, friends, search, delete account
    │   └── messageController.js     # send, fetch, delete messages, conversations
    ├── middleware/
    │   ├── authMiddleware.js        # JWT protect middleware
    │   └── errorHandler.js          # Global error handler
    ├── models/
    │   ├── User.js                  # User schema
    │   ├── Message.js               # Message schema
    │   └── Conversation.js          # Conversation schema
    ├── routes/
    │   ├── authRoutes.js            # POST /register /login /forgot /reset
    │   ├── userRoutes.js            # GET/PUT/POST/DELETE user endpoints
    │   └── messageRoutes.js         # GET/POST/DELETE message endpoints
    ├── socket/
    │   └── socketManager.js         # All Socket.io event logic
    └── utils/
        ├── generateToken.js         # JWT sign utility
        └── multer.js                # Multer + Cloudinary storage config
```

---

## ✨ Features

### Auth
- Register with fullName, userId, password, secret pet name (for recovery)
- Login with userId + password
- Forgot password — 2-step: verify pet name → reset password
- JWT authentication (7 day expiry)

### Profile
- Upload / change / remove profile picture (stored on Cloudinary)
- Edit about bio
- View joined date
- Delete account (type "delete" to confirm) — removes all messages, files, and conversations

### Friends
- Search users by userId
- Send / accept / decline friend requests
- Remove friend
- View friend profile modal with online status

### Messaging
- Real-time messaging via Socket.io
- Send text, emoji, images, videos, PDFs, text files (≤ 10MB)
- Clickable link detection in messages
- Delete for Me / Delete for Everyone (also deletes file from Cloudinary)
- Message ticks: ✓ sent · ✓✓ delivered · ✓✓ seen (blue)
- Unread badges (live, clears on open)

### Open Locker
- Self-chat for personal notes and file storage

### UI/UX
- Dark mode / Light mode toggle (persisted to localStorage)
- Mobile responsive — sidebar/chat toggle with back button
- Logout button hidden on mobile (accessible via profile modal)
- Fullscreen media viewer for images and videos

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account (free tier)

### 1. Clone the repo
```bash
git clone https://github.com/apurba2099/bhai-log.git
cd bhai-log
```

### 2. Setup Server
```bash
cd server
cp .env.example .env
npm install
```

Fill in `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/bhailog
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
NODE_ENV=development

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

```bash
npm run dev
```

### 3. Setup Client
```bash
cd client
cp .env.example .env
npm install
```

Fill in `client/.env`:
```env
VITE_SERVER_URL=http://localhost:5000
```

```bash
npm run dev
```

Frontend: `http://localhost:3000` · Backend: `http://localhost:5000`

---

## 🌐 Deployment

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend (client/) |
| **Render** | Backend (server/) |
| **MongoDB Atlas** | Database |
| **Cloudinary** | File storage |

### Render Environment Variables
```env
PORT=10000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_URL=https://your-app.vercel.app
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Vercel Environment Variables
```env
VITE_SERVER_URL=https://your-backend.onrender.com
```

---

## 🔌 Socket.io Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `user:online` | Client → Server | Mark user online |
| `user:statusChange` | Server → All | Broadcast online/offline |
| `message:send` | Client → Server | Deliver message to recipient |
| `message:receive` | Server → Recipient | Incoming real-time message |
| `message:statusUpdate` | Server → Sender | Tick update (delivered) |
| `message:seen` | Client → Server | Viewer opened conversation |
| `message:allSeen` | Server → Sender | Blue ticks for all messages |
| `message:deleteForEveryone` | Client → Server | Relay deletion to recipient |
| `message:deleted` | Server → Recipient | Remove message from UI |
| `notification:unread` | Server → Recipient | Unread badge count |
| `friend:requestSent` | Client → Server | Notify recipient of request |
| `friend:newRequest` | Server → Recipient | New friend request |
| `friend:requestAccepted` | Client → Server | Notify sender of acceptance |
| `friend:accepted` | Server → Sender | Request accepted |
| `account:deleted` | Client → Server | Notify friends of deletion |
| `friend:accountDeleted` | Server → Friends | Remove deleted user from UI |

---

## 📦 File Upload Flow

```
User selects file
      ↓
Frontend sends FormData
      ↓
Multer receives file (memory)
      ↓
multer-storage-cloudinary uploads to Cloudinary
      ↓
Cloudinary returns secure_url
      ↓
URL stored in MongoDB
      ↓
Frontend displays image using Cloudinary URL
```

Files are organised in Cloudinary folders:
- `bhailog/images/` — photos
- `bhailog/videos/` — videos
- `bhailog/pdfs/` — PDF documents
- `bhailog/texts/` — text files

---

## 🔐 Security

- Passwords hashed with **bcryptjs**
- Pet name (secret question) hashed with **bcryptjs**
- JWT tokens expire after **7 days**
- Routes protected with `authMiddleware`
- CORS restricted to `CLIENT_URL` in production
- `.env` never committed to git

---

## 📄 License

MIT License — feel free to use and modify.

---

> © All Rights Reserved | Built by **Apurba Dutta**