/**
 * MODIFIED FOR VERCEL + RENDER DEPLOYMENT
 * 1. Removed node-style imports (browser uses global React from CDN).
 * 2. Hardcoded Render.com URLs to avoid 'process is not defined' errors.
 */

// REPLACE THIS URL with your actual Render.com service URL
const RENDER_BACKEND_URL = 'https://chat-vid-voice.onrender.com'; 

const API_URL = RENDER_BACKEND_URL;
const WS_URL = RENDER_BACKEND_URL.replace('https://', 'wss://');

// Destructure hooks from the global React object
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
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createRoom = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRoomId(data.roomId);
      setScreen('chatting');
      connectWebSocket(data.roomId, username.trim());
    } catch (err) {
      setError(err.message);
    }
  };

  const joinRoom = async () => {
    if (!roomId.trim() || !username.trim()) {
      setError('Please enter both room ID and username');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: roomId.trim(), username: username.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setScreen('chatting');
      connectWebSocket(roomId.trim(), username.trim());
    } catch (err) {
      setError(err.message);
    }
  };

  const connectWebSocket = (room, user) => {
    ws.current = new WebSocket(WS_URL);
    ws.current.onopen = () => {
      setIsConnected(true);
      setError('');
      ws.current.send(JSON.stringify({ type: 'join', roomId: room, username: user }));
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'message') {
        setMessages(prev => [...prev, message]);
      } else if (message.type === 'history') {
        setMessages(message.messages);
      } else if (message.type === 'members_list') {
        setMembers(message.members);
      } else if (message.type === 'user_joined') {
        setMembers(prev => [...prev, { id: message.userId, username: message.username }]);
      } else if (message.type === 'user_left') {
        setMembers(prev => prev.filter(m => m.id !== message.userId));
      } else if (message.type === 'user_typing') {
        setIsTyping(prev => ({ ...prev, [message.userId]: message.isTyping }));
      } else if (message.type === 'error') {
        setError(message.message);
      }
    };

    ws.current.onerror = () => { setError('Connection error'); setIsConnected(false); };
    ws.current.onclose = () => { setIsConnected(false); };
  };

  const sendMessage = () => {
    if (!inputText.trim() || !ws.current) return;
    ws.current.send(JSON.stringify({ type: 'chat', text: inputText.trim() }));
    setInputText('');
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    if (ws.current?.readyState === 1) {
      ws.current.send(JSON.stringify({ type: 'typing', isTyping: true }));
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (ws.current?.readyState === 1) {
          ws.current.send(JSON.stringify({ type: 'typing', isTyping: false }));
        }
      }, 1000);
    }
  };

  const leaveRoom = () => {
    if (ws.current) ws.current.close();
    setScreen('home');
    setRoomId('');
    setUsername('');
    setMessages([]);
    setMembers([]);
  };

  if (screen === 'home') {
    return (
      <div className="container home">
        <div className="home-content">
          <h1>SecureChat</h1>
          <p className="subtitle">Secure group chat for up to 5 people</p>
          <input type="text" placeholder="Your name" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button className="btn btn-primary" onClick={createRoom}>Create Room</button>
          <div className="divider">or</div>
          <div className="join-section">
            <input type="text" placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
            <button className="btn btn-secondary" onClick={joinRoom}>Join</button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="container chat">
      <div className="chat-header">
        <h2>SecureChat</h2>
        <span className={isConnected ? "connected" : "disconnected"}>
          {isConnected ? "● Connected" : "● Offline"}
        </span>
        <button onClick={leaveRoom}>✕</button>
      </div>
      <div className="chat-content">
        <div className="sidebar">
          <h3>Members ({members.length}/5)</h3>
          {members.map(m => (
            <div key={m.id} className="member">
              {m.username} {isTyping[m.id] ? "..." : ""}
            </div>
          ))}
        </div>
        <div className="messages-section">
          <div className="messages">
            {messages.map(m => (
              <div key={m.id} className="message-item">
                <strong>{m.username}</strong>: {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="input-section">
            <input value={inputText} onChange={handleTyping} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} />
            <button onClick={sendMessage} disabled={!isConnected}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Global ReactDOM render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ChatApp />);
