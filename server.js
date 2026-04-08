const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware to serve static files
app.use(express.static('public'));

// API route for room creation
app.post('/api/rooms', (req, res) => {
    // Logic to create a new room
    // (e.g., store room info in a database)
    const roomId = createRoom(); // Your implementation here
    res.status(201).json({ roomId });
});

// API route for joining a room
app.post('/api/rooms/:id/join', (req, res) => {
    const roomId = req.params.id;
    // Logic to join a room
    // (e.g., validate room exists, add user to room, etc.)
    joinRoom(roomId); // Your implementation here
    res.status(200).json({ message: 'Joined room successfully' });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
        // Handle messages from clients (broadcast, etc.)
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

function createRoom() {
    // Your logic to create and return a room ID
    return 'room123'; // Dummy example
}

function joinRoom(roomId) {
    // Your logic to join the room
    console.log(`User joined room: ${roomId}`);
}
