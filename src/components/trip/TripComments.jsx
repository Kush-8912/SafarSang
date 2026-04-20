import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useTripContext } from '../../context/TripContext';
import { addComment } from '../../services/trip.service';
import { useAuth } from '../../context/AuthContext';

/**
 * TripComments — real-time trip discussion board.
 * Demonstrates useRef for auto-scroll, controlled input, and lists/keys.
 */
const TripComments = () => {
  const { activeTrip, comments, setComments } = useTripContext();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null); // Ref for auto-scroll

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const commentData = {
      text: text.trim(),
      userId: user?.uid,
      userName: user?.displayName || 'Anonymous',
      createdAt: new Date().toISOString(),
    };
    try {
      const ref = await addComment(activeTrip.id, commentData);
      setComments((prev) => [...prev, { id: ref.id, ...commentData }]);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) +
      ' · ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const initials = (name) => name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="chat-wrap animate-fade-in">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon" style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--sky-400)' }}>
            <MessageSquare size={18} />
          </span>
          Trip Comments
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{comments.length} messages</span>
      </div>

      {/* Messages */}
      <div className="chat-msgs">
        {comments.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <MessageSquare size={36} />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((c) => {
            const isMe = c.userId === user?.uid;
            return (
              <div key={c.id} className={`msg-row ${isMe ? 'me' : ''}`}>
                {!isMe && (
                  <div className="msg-avatar">{initials(c.userName)}</div>
                )}
                <div className={`msg-bubble ${isMe ? 'msg-mine' : 'msg-theirs'}`}>
                  {!isMe && <p className="msg-name">{c.userName}</p>}
                  <p className="msg-text">{c.text}</p>
                  <p className="msg-time">{formatTime(c.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="form-input chat-textarea"
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          rows={2}
          id="chat-input"
        />
        <button
          className={`send-btn ${text.trim() && !sending ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || sending}
          id="chat-send-btn"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>

      <style>{`
        .chat-wrap { display: flex; flex-direction: column; gap: 1rem; }
        .chat-msgs {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1rem;
          min-height: 260px;
          max-height: 420px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          scroll-behavior: smooth;
        }
        .msg-row { display: flex; align-items: flex-end; gap: 0.5rem; }
        .msg-row.me { flex-direction: row-reverse; }
        .msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--gradient-brand);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-bottom: 2px;
        }
        .msg-bubble {
          max-width: 70%;
          border-radius: var(--radius-md);
          padding: 0.6rem 0.9rem;
        }
        .msg-theirs {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-bottom-left-radius: 4px;
        }
        .msg-mine {
          background: rgba(20,184,166,0.15);
          border: 1px solid rgba(20,184,166,0.25);
          border-bottom-right-radius: 4px;
        }
        .msg-name { font-size: 0.7rem; font-weight: 600; color: var(--teal-400); margin-bottom: 0.2rem; }
        .msg-text { font-size: 0.88rem; color: var(--text-primary); white-space: pre-wrap; word-break: break-word; margin: 0; }
        .msg-time { font-size: 0.68rem; color: var(--text-muted); margin-top: 0.25rem; }
        .chat-input-row {
          display: flex;
          gap: 0.6rem;
          align-items: flex-end;
        }
        .chat-textarea {
          flex: 1;
          resize: none;
          border-radius: var(--radius-md);
        }
        .send-btn {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
          background: var(--bg-elevated);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .send-btn.active {
          background: var(--gradient-brand);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 12px rgba(20,184,166,0.3);
        }
        .send-btn:disabled { opacity: 0.4; cursor: default; }
      `}</style>
    </div>
  );
};

export default TripComments;
