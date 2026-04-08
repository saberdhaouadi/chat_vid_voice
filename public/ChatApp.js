/**
 * VERCEL-READY CHAT LOGIC
 * Fixed: Removed Node 'imports' and 'process.env' references.
 */

// 1. REPLACE THIS URL with your actual Render service URL
const BACKEND_URL = 'https://chat-vid-voice.onrender.com'; 

const API_URL = BACKEND_URL;
const WS_URL = BACKEND_URL.replace('https://', 'wss://');

const { useState, useEffect, useRef } = React;

function ChatApp() {
  const [screen, setScreen] = useState('home');
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const ws = useRef(null);

  const connect = (rId) => {
    ws.current = new WebSocket(WS_URL);
    ws.current.onopen = () => ws.current.send(JSON.stringify({ type: 'join', roomId: rId, username }));
    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'message') setMessages(prev => [...prev, msg]);
      if (msg.type === 'history') setMessages(msg.messages || []);
    };
    ws.current.onerror = () => setError('Connection error. Is backend running?');
  };

  const createRoom = async () => {
    if (!username) return setError('Enter a name');
    try {
      const res = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      setRoomId(data.roomId);
      setScreen('chat');
      connect(data.roomId);
    } catch (err) { setError('Failed to create room'); }
  };

  const joinRoom = async () => {
    if (!username || !roomId) return setError('Enter name and room ID');
    try {
      const res = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, username })
      });
      if (!res.ok) throw new Error();
      setScreen('chat');
      connect(roomId);
    } catch (err) { setError('Room not found or full'); }
  };

  if (screen === 'home') {
    return (
      <div className="container">
        <h2 style={{textAlign: 'center'}}>SecureChat</h2>
        <input placeholder="Your Name" value={username} onChange={e => setUsername(e.target.value)} />
        <button onClick={createRoom}>Create Room</button>
        <p style={{textAlign: 'center', margin: '10px 0'}}>OR</p>
        <input placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} />
        <button onClick={joinRoom}>Join Room</button>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="container">
      <h3>Room: {roomId.substring(0,8)}...</h3>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} style={{marginBottom: '8px'}}>
            <b style={{color: '#10b981'}}>{m.username}:</b> {m.text}
          </div>
        ))}
      </div>
      <input 
        placeholder="Type message..." 
        value={inputText} 
        onChange={e => setInputText(e.target.value)}
        onKeyPress={(e) => {
          if(e.key === 'Enter' && inputText.trim()) {
            ws.current.send(JSON.stringify({ type: 'chat', username, text: inputText }));
            setInputText('');
          }
        }}
      />
      <button onClick={() => {
        if(inputText.trim()) {
          ws.current.send(JSON.stringify({ type: 'chat', username, text: inputText }));
          setInputText('');
        }
      }}>Send</button>
      <button 
        style={{marginTop: '10px', background: '#475569'}} 
        onClick={() => { if(ws.current) ws.current.close(); setScreen('home'); }}
      >Leave</button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ChatApp />);
