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

// Enable CORS for your Vercel frontend URL
app.use(cors({
  origin: process.env.FRONTEND_URL || '*' 
}));

app.use(express.json());

// ... (Keep your existing room and logic code here) ...

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 Secure Chat Server running on port ${PORT}`);
});
