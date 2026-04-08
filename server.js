import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { randomBytes } from 'crypto';
import cors from 'cors';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Enable CORS for Vercel deployment
app.use(cors());
app.use(express.json());

const rooms = new Map();
const MAX_USERS_PER_ROOM = 5;

app.post('/api/rooms/create', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const roomId = randomBytes(16).toString('hex');
  rooms.set(roomId, { id: roomId, members: new Map(), messageHistory: [] });
  res.json({ roomId });
});

app.post('/api/rooms/join', (req, res) => {
  const { roomId, username } = req.body;
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.members.size >= MAX_USERS_PER_ROOM) return res.status(403).json({ error: 'Room full' });
  res.json({ roomId });
});

wss.on('connection', (ws) => {
  let roomId = null;
  let userId = randomBytes(8).toString('hex');

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'join') {
      roomId = msg.roomId;
      const room = rooms.get(roomId);
      if (room) {
        room.members.set(userId, { id: userId, username: msg.username, ws });
        ws.send(JSON.stringify({ type: 'history', messages: room.messageHistory }));
      }
    } else if (msg.type === 'chat' && roomId) {
      const room = rooms.get(roomId);
      if (room) {
        const chatMsg = { type: 'message', username: msg.username, text: msg.text, id: randomBytes(4).toString('hex') };
        room.messageHistory.push(chatMsg);
        room.members.forEach(m => m.ws.send(JSON.stringify(chatMsg)));
      }
    }
  });

  ws.on('close', () => {
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).members.delete(userId);
    }
  });
});

// Use Render's environment variable for Port
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
