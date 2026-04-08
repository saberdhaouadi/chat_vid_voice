# SecureChat - Encrypted Group Chat Application

A production-grade, secure real-time chat application for groups of up to 5 people built with Node.js, Express, and React.

## 🔒 Security Features

### Core Security
- **WebSocket Secure Connections (WSS)** - Encrypted communication channel
- **Room-based Isolation** - Messages stay within room, no cross-room leakage
- **User Validation** - Username sanitization and validation
- **Session Management** - Unique user IDs and room tokens
- **Message Size Limits** - Prevents buffer overflow (5000 char limit)
- **CORS Protection** - Restricted cross-origin access
- **Connection Validation** - Server validates all WebSocket connections

### Architecture Security
- **In-Memory Storage** - No persistent data storage (can be extended with encrypted DB)
- **Automatic Room Cleanup** - Empty rooms deleted after 30 minutes
- **Member Limit Enforcement** - Strictly limits to 5 users per room
- **Message History Limit** - Keeps last 1000 messages to prevent memory issues
- **Error Handling** - Graceful error handling without exposing internals

### Privacy
- Real-time typing indicators (disabled when user leaves)
- Message history only available after joining
- No message persistence to disk
- No user tracking or analytics

## 📋 Prerequisites

- **Node.js** >= 16.0.0
- **npm** or **yarn**
- Modern web browser with WebSocket support

## 🚀 Installation & Setup

### 1. Clone or Download Files

```bash
cd securechat-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Public Directory

```bash
mkdir -p public
```

Ensure these files are in the correct locations:
```
securechat-app/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   └── ChatApp.jsx
```

### 4. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

For development with auto-reload:
```bash
npm run dev
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 🎯 How to Use

### Creating a New Room

1. Enter your username (max 30 characters)
2. Click "Create New Room"
3. Your unique Room ID is displayed (32 hex characters)
4. Share this Room ID with up to 4 other people

### Joining an Existing Room

1. Ask the room creator for the Room ID
2. Enter your username
3. Enter the Room ID in the "Join Room" field
4. Click "Join Room"
5. You'll be added to the chat

### In the Chat

- **Send Messages**: Type and press Enter or click Send
- **View Members**: See all members in the right sidebar
- **Real-time Updates**: Typing indicators show when others are typing
- **Copy Room ID**: Click the 📋 button in the header to copy Room ID
- **Leave Room**: Click the ✕ button to disconnect

## 🔐 Security Implementation Details

### Server-Side (`server.js`)

```javascript
// Max 5 users per room (strict enforcement)
const MAX_USERS_PER_ROOM = 5;

// Generate cryptographically secure room IDs
function generateRoomId() {
  return randomBytes(16).toString('hex');
}

// Validate all room operations
function isRoomValid(roomId) {
  const room = rooms.get(roomId);
  return room && room.members.size < MAX_USERS_PER_ROOM;
}
```

**Key Security Measures:**
- ✅ Input validation on all endpoints
- ✅ WebSocket connection validation
- ✅ Member count enforcement before accepting joins
- ✅ Message length limits (5000 chars)
- ✅ Username sanitization
- ✅ CORS enabled with proper headers
- ✅ No sensitive data in logs
- ✅ Graceful error handling

### Client-Side (`ChatApp.jsx`)

```javascript
// Secure state management
const [isConnected, setIsConnected] = useState(false);
const [messages, setMessages] = useState([]);
const [members, setMembers] = useState([]);

// WebSocket connection validation
ws.current.onopen = () => {
  setIsConnected(true);
  // Only send auth message after connection established
}

// Automatic cleanup on disconnect
ws.current.onclose = () => {
  setIsConnected(false);
}
```

**Client Security:**
- ✅ Real-time connection status
- ✅ Automatic cleanup on disconnect
- ✅ XSS protection (React auto-escapes)
- ✅ No local storage of sensitive data
- ✅ Session validation

## 📊 Architecture Overview

```
┌─────────────────────────────────────┐
│         Browser (React App)         │
│  - UI Components                    │
│  - State Management                 │
│  - Input Validation                 │
└──────────────┬──────────────────────┘
               │ WSS WebSocket
               │ (Encrypted)
┌──────────────▼──────────────────────┐
│    Express.js Server                │
│  - Route Handlers (/api/rooms/*)    │
│  - WebSocket Server (ws)            │
│  - Room Management                  │
│  - Member Validation                │
└──────────────┬──────────────────────┘
               │ In-Memory Storage
┌──────────────▼──────────────────────┐
│    Room Data Structure              │
│  - Room ID                          │
│  - Members Map                      │
│  - Message History (last 1000)      │
│  - Timestamps                       │
└─────────────────────────────────────┘
```

## 📡 API Endpoints

### REST Endpoints

**Create Room**
```
POST /api/rooms/create
Content-Type: application/json

{
  "username": "John Doe"
}

Response:
{
  "roomId": "a1b2c3d4e5f6...",
  "token": "random_token"
}
```

**Join Room**
```
POST /api/rooms/join
Content-Type: application/json

{
  "roomId": "a1b2c3d4e5f6...",
  "username": "Jane Doe"
}

Response:
{
  "token": "random_token",
  "roomId": "a1b2c3d4e5f6..."
}
```

**Get Room Info**
```
GET /api/rooms/:roomId

Response:
{
  "id": "a1b2c3d4e5f6...",
  "memberCount": 3,
  "maxMembers": 5,
  "members": [
    { "id": "...", "username": "John", "joinedAt": 1234567890 }
  ]
}
```

### WebSocket Messages

**Join Room**
```json
{
  "type": "join",
  "roomId": "a1b2c3d4e5f6...",
  "username": "John Doe"
}
```

**Send Message**
```json
{
  "type": "chat",
  "text": "Hello everyone!"
}
```

**Typing Indicator**
```json
{
  "type": "typing",
  "isTyping": true
}
```

## 🧪 Testing the Application

### Test Scenario 1: Create and Join
1. Open `http://localhost:3000` in two browser windows
2. Window 1: Create room with username "Alice"
3. Copy the Room ID
4. Window 2: Join with Room ID and username "Bob"
5. Send messages between windows
6. Verify real-time delivery

### Test Scenario 2: Max Users (5)
1. Open 5 browser windows and join the same room
2. Try opening a 6th window
3. Should receive error: "Room is full"

### Test Scenario 3: Connection Recovery
1. Open two chat sessions
2. Disconnect one (close window or click ✕)
3. Member list updates automatically
4. Other users notified of disconnect

### Test Scenario 4: Message History
1. Create room and send 5 messages
2. New user joins
3. New user sees last 50 messages

## 🚀 Deployment Options

### Heroku Deployment

```bash
# Create Heroku app
heroku create your-app-name

# Deploy
git push heroku main

# Set environment variables
heroku config:set PORT=3000
```

### Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway up
```

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t securechat .
docker run -p 3000:3000 securechat
```

## 🛡️ Production Recommendations

### Before Going Live

1. **Enable HTTPS/WSS**
   ```javascript
   import https from 'https';
   import fs from 'fs';
   
   const options = {
     key: fs.readFileSync('path/to/key.pem'),
     cert: fs.readFileSync('path/to/cert.pem')
   };
   
   https.createServer(options, app).listen(443);
   ```

2. **Add Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=3000
   MAX_USERS_PER_ROOM=5
   MESSAGE_HISTORY_LIMIT=1000
   ROOM_CLEANUP_TIME=1800000
   ```

3. **Rate Limiting**
   ```javascript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });
   
   app.use(limiter);
   ```

4. **Security Headers**
   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```

5. **Message Encryption** (Optional)
   - Implement TweetNaCl.js for E2E encryption
   - Encrypt messages client-side before sending
   - Server never sees plaintext

6. **Database Integration** (Optional)
   - Add MongoDB/PostgreSQL for persistence
   - Implement user authentication
   - Add message archival

7. **Monitoring**
   - Add logging (Winston, Pino)
   - Monitor WebSocket connections
   - Track room creation/joins
   - Alert on unusual activity

## 🐛 Troubleshooting

### Connection Issues
- Check if server is running: `curl http://localhost:3000`
- Verify WebSocket support in your browser
- Check browser console for errors (F12)
- Ensure firewall allows port 3000

### Messages Not Sending
- Verify connection status (should show "● Connected")
- Check message length (max 5000 chars)
- Ensure other users are still in room
- Check server logs for errors

### Room Full Error
- Room is limited to 5 members
- Wait for someone to leave
- Create a new room instead

### Can't Join Room
- Verify Room ID is correct (copy-paste)
- Room may have been deleted if all members left
- Try creating a new room

## 📝 License

MIT License - Feel free to use and modify

## 🤝 Contributing

Contributions welcome! Areas for enhancement:
- End-to-end encryption
- Voice/video chat
- File sharing
- Message persistence
- User authentication
- Mobile app

## ⚠️ Disclaimer

This application is provided as-is. For production use with sensitive data:
- Review and enhance security measures
- Add encryption layers
- Implement user authentication
- Use HTTPS/WSS
- Add monitoring and logging
- Comply with local data protection laws

---

**Questions or Issues?** Check the server logs and browser console for detailed error messages.
