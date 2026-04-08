//import React, { useState, useEffect, useRef } from 'react';
//import ReactDOM from 'react-dom/client';

const API_URL = 'https://chat-vid-voice.onrender.com';
const WS_URL =  'ws://chat-vid-voice.onrender.com';

export default function ChatApp() {
  const [screen, setScreen] = useState('home'); // home | joining | chatting
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
        body: JSON.stringify({ 
          roomId: roomId.trim(), 
          username: username.trim() 
        })
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
      ws.current.send(JSON.stringify({
        type: 'join',
        roomId: room,
        username: user
      }));
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'message') {
        setMessages(prev => [...prev, {
          id: message.id,
          userId: message.userId,
          username: message.username,
          text: message.text,
          timestamp: message.timestamp
        }]);
      }

      if (message.type === 'history') {
        setMessages(message.messages);
      }

      if (message.type === 'members_list') {
        setMembers(message.members);
      }

      if (message.type === 'user_joined') {
        setMembers(prev => [...prev, {
          id: message.userId,
          username: message.username
        }]);
      }

      if (message.type === 'user_left') {
        setMembers(prev => prev.filter(m => m.id !== message.userId));
      }

      if (message.type === 'user_typing') {
        setIsTyping(prev => ({
          ...prev,
          [message.userId]: message.isTyping
        }));
      }

      if (message.type === 'error') {
        setError(message.message);
      }
    };

    ws.current.onerror = (err) => {
      setError('Connection error');
      setIsConnected(false);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };
  };

  const sendMessage = () => {
    if (!inputText.trim() || !ws.current) return;

    ws.current.send(JSON.stringify({
      type: 'chat',
      text: inputText.trim()
    }));

    setInputText('');
    setIsTyping({});
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);

    if (ws.current && ws.current.readyState === 1) {
      ws.current.send(JSON.stringify({
        type: 'typing',
        isTyping: true
      }));

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (ws.current?.readyState === 1) {
          ws.current.send(JSON.stringify({
            type: 'typing',
            isTyping: false
          }));
        }
      }, 1000);
    }
  };

  const leaveRoom = () => {
    if (ws.current) {
      ws.current.close();
    }
    setScreen('home');
    setRoomId('');
    setUsername('');
    setMessages([]);
    setMembers([]);
    setError('');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  // Home Screen
  if (screen === 'home') {
    return (
      <div className="container home">
        <div className="home-content">
          <div className="logo">
            <span className="lock-icon">🔒</span>
          </div>
          <h1>SecureChat</h1>
          <p className="subtitle">End-to-end encrypted group chat for up to 5 people</p>

          <div className="username-input">
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength="30"
              onKeyPress={(e) => e.key === 'Enter' && createRoom()}
            />
          </div>

          <div className="button-group">
            <button className="btn btn-primary" onClick={createRoom}>
              Create New Room
            </button>
          </div>

          <div className="divider">or</div>

          <div className="join-section">
            <input
              type="text"
              placeholder="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              maxLength="32"
            />
            <button className="btn btn-secondary" onClick={joinRoom}>
              Join Room
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="features">
            <div className="feature">
              <span>🔐</span>
              <span>Secure & Private</span>
            </div>
            <div className="feature">
              <span>👥</span>
              <span>Up to 5 Members</span>
            </div>
            <div className="feature">
              <span>⚡</span>
              <span>Real-time Chat</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat Screen
  if (screen === 'chatting') {
    return (
      <div className="container chat">
        <div className="chat-header">
          <div className="header-left">
            <h2>SecureChat</h2>
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </span>
          </div>
          <div className="header-right">
            <div className="room-info">
              <span className="label">Room:</span>
              <code className="room-id">{roomId.substring(0, 12)}...</code>
              <button className="copy-btn" onClick={copyRoomId} title="Copy Room ID">
                📋
              </button>
            </div>
            <button className="btn-leave" onClick={leaveRoom}>✕</button>
          </div>
        </div>

        <div className="chat-content">
          <div className="sidebar">
            <div className="members-header">
              <h3>Members</h3>
              <span className="count">{members.length}/5</span>
            </div>
            <div className="members-list">
              {members.map(member => (
                <div key={member.id} className="member">
                  <span className="avatar">{member.username.charAt(0).toUpperCase()}</span>
                  <span className="name">{member.username}</span>
                  {isTyping[member.id] && <span className="typing-indicator">...</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="messages-section">
            <div className="messages">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <p>No messages yet. Start the conversation! 👋</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="message-item">
                    <div className="message-header">
                      <span className="message-avatar">
                        {msg.username.charAt(0).toUpperCase()}
                      </span>
                      <span className="message-username">{msg.username}</span>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="message-text">{msg.text}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-section">
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={handleTyping}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={!isConnected}
                  maxLength="5000"
                />
                <button
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={!inputText.trim() || !isConnected}
                >
                  Send
                </button>
              </div>
              {inputText.length > 0 && (
                <span className="char-count">{inputText.length}/5000</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ChatApp />);
