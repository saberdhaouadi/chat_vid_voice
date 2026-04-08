/**
 * FINAL VERCEL VERSION
 * - NO imports (uses global React from CDN)
 * - NO process.env (uses hardcoded strings)
 */

// 1. REPLACE THIS with your actual Render URL
const RENDER_URL = 'https://chat-vid-voice.onrender.com'; 

const API_URL = RENDER_URL;
const WS_URL = RENDER_URL.replace('https://', 'wss://');

// 2. Access React hooks from the global window object
const { useState, useEffect, useRef } = React;

export default function ChatApp() {
  const [screen, setScreen] = useState('home');
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState({});
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const connectWebSocket = (room, user) => {
    ws.current = new WebSocket(WS_URL);
    ws.current.onopen = () => {
      setIsConnected(true);
      setError('');
      ws.current.send(JSON.stringify({ type: 'join', roomId: room, username: user }));
    };
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'message') setMessages(prev => [...prev, msg]);
      if (msg.type === 'history') setMessages(msg.messages);
      if (msg.type === 'members_list') setMembers(msg.members);
      if (msg.type === 'error') setError(msg.message);
    };
    ws.current.onclose = () => setIsConnected(false);
    ws.current.onerror = () => setError('Connection lost');
  };

  const createRoom = async () => {
    if (!username.trim()) return setError('Enter a username');
    try {
      const res = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoomId(data.roomId);
      setScreen('chatting');
      connectWebSocket(data.roomId, username.trim());
    } catch (err) { setError(err.message); }
  };

  const joinRoom = async () => {
    if (!roomId.trim() || !username.trim()) return setError('Enter Room ID and Name');
    try {
      const res = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: roomId.trim(), username: username.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScreen('chatting');
      connectWebSocket(roomId.trim(), username.trim());
    } catch (err) { setError(err.message); }
  };

  if (screen === 'home') {
    return (
      <div className="container home">
        <h1>SecureChat</h1>
        <input type="text" placeholder="Name" value={username} onChange={e => setUsername(e.target.value)} />
        <button onClick={createRoom}>Create Room</button>
        <p>OR</p>
        <input type="text" placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} />
        <button onClick={joinRoom}>Join Room</button>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className="container chat">
      <header>
        <h2>Room: {roomId.substring(0,8)}...</h2>
        <span>{isConnected ? "● Online" : "○ Connecting..."}</span>
      </header>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i}><strong>{m.username}</strong>: {m.text}</div>
        ))}
      </div>
      <div className="input-section">
        <input value={inputText} onChange={e => setInputText(e.target.value)} />
        <button onClick={() => {
            ws.current.send(JSON.stringify({ type: 'chat', text: inputText }));
            setInputText('');
        }}>Send</button>
      </div>
    </div>
  );
}

// 3. Render using global ReactDOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ChatApp />);
