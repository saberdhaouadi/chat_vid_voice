import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { randomBytes } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// MODIFICATION: Enable CORS to allow your frontend to connect to this API
// You can replace '*' with your specific Vercel URL for better security
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST']
}));

app.use(express.json());

// In-memory store for rooms (groups)
const rooms = new Map();
const MAX_USERS_PER_ROOM = 5; //

// Generate secure room ID
function generateRoomId() {
  return randomBytes(16).toString('hex');
}

// Create new room
app.post('/api/rooms/create', (req, res) => {
  const { username } = req.body;
  
  if (!username || username.length > 30 || username.length < 1) {
    return res.status(400).json({ error: 'Invalid username' });
  }

  const roomId = generateRoomId();
  const room = {
    id: roomId,
    createdAt: Date.now(),
    members: new Map(),
    messageHistory: [],
    maxMessages: 1000
  };
  
  rooms.set(roomId, room);
  
  res.json({ 
    roomId, 
    token: randomBytes(32).toString('hex')
  });
});

// Join existing room
app.post('/api/rooms/join', (req, res) => {
  const { roomId, username } = req.body;
  
  if (!roomId || !username) {
    return res.status(400).json({ error: 'Missing roomId or username' });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.members.size >= MAX_USERS_PER_ROOM) {
    return res.status(403).json({ error: 'Room is full' });
  }

  res.json({ 
    token: randomBytes(32).toString('hex'),
    roomId 
  });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  let roomId = null;
  let userId = randomBytes(16).toString('hex');
  let username = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'join') {
        const room = rooms.get(message.roomId);
        if (!room || room.members.size >= MAX_USERS_PER_ROOM) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Cannot join room' 
          }));
          ws.close();
          return;
        }

        roomId = message.roomId;
        username = message.username;

        room.members.set(userId, {
          id: userId,
          username,
          joinedAt: Date.now(),
          ws
        });

        broadcastToRoom(roomId, {
          type: 'user_joined',
          username,
          userId,
          memberCount: room.members.size
        }, userId);

        ws.send(JSON.stringify({
          type: 'history',
          messages: room.messageHistory.slice(-50)
        }));

        ws.send(JSON.stringify({
          type: 'members_list',
          members: Array.from(room.members.values()).map(m => ({
            id: m.id,
            username: m.username
          }))
        }));
      }

      if (message.type === 'chat') {
        if (!roomId) return;
        
        const room = rooms.get(roomId);
        if (!room) return;

        const chatMessage = {
          id: randomBytes(8).toString('hex'),
          userId,
          username,
          text: message.text.slice(0, 5000), 
          timestamp: Date.now(),
          type: 'text'
        };

        room.messageHistory.push(chatMessage);
        if (room.messageHistory.length > room.maxMessages) {
          room.messageHistory.shift();
        }

        broadcastToRoom(roomId, {
          type: 'message',
          ...chatMessage
        });
      }

      if (message.type === 'typing') {
        if (!roomId) return;
        broadcastToRoom(roomId, {
          type: 'user_typing',
          userId,
          username,
          isTyping: message.isTyping
        }, userId);
      }

    } catch (err) {
      console.error('WebSocket error:', err);
    }
  });

  ws.on('close', () => {
    if (roomId && username) {
      const room = rooms.get(roomId);
      if (room) {
        room.members.delete(userId);
        broadcastToRoom(roomId, {
          type: 'user_left',
          username,
          userId,
          memberCount: room.members.size
        });
      }
    }
  });
});

function broadcastToRoom(roomId, data, excludeUserId = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  const payload = JSON.stringify(data);
  room.members.forEach((member) => {
    if (excludeUserId && member.id === excludeUserId) return;
    if (member.ws.readyState === 1) { 
      member.ws.send(payload);
    }
  });
}

// MODIFICATION: Use port from environment variable and bind to 0.0.0.0 for Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 Secure Chat Server running on port ${PORT}`);
});
