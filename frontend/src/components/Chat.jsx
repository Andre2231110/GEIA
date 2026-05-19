import { useState, useRef, useEffect } from 'react'
import './Chat.css'

const ROLE_LABEL = { aluno: 'Aluno', professor: 'Professor', admin: 'Administrador' }

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chatUser')) } catch { return null }
  })
  const [showLogin, setShowLogin] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    if (!user) {
      setShowLogin(true)
      return
    }

    setInput('')
    textareaRef.current.style.height = 'auto'
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch('/api/llmcloud/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Erro ao comunicar com o servidor. Tenta novamente.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleInput(e) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch('/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data)
        localStorage.setItem('chatUser', JSON.stringify(data))
        setShowLogin(false)
        setLoginForm({ email: '', password: '' })
      } else {
        setLoginError(data.error || 'Erro ao entrar.')
      }
    } catch {
      setLoginError('Erro ao conectar ao servidor.')
    } finally {
      setLoginLoading(false)
    }
  }

  function handleLogout() {
    setUser(null)
    localStorage.removeItem('chatUser')
    setMessages([])
  }

  return (
    <div className="chat-layout">

      <aside className="chat-nav">
        <div className="chat-nav-logo">GEIA</div>
        <div className="chat-nav-spacer" />
        <div className="chat-nav-footer">
          {user ? (
            <div className="chat-account">
              <div className="chat-account-avatar">{user.name[0].toUpperCase()}</div>
              <div className="chat-account-info">
                <p className="chat-account-name">{user.name}</p>
                <p className="chat-account-role">{ROLE_LABEL[user.role] || user.role}</p>
              </div>
              <button className="chat-logout-btn" onClick={handleLogout} title="Sair">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <button className="chat-entrar-btn" onClick={() => setShowLogin(true)}>
              Entrar
            </button>
          )}
        </div>
      </aside>

      <div className="chat">
        <div className="chat-body">

          {messages.map((msg, i) => (
            <div key={i} className={`msg msg-${msg.role}`}>
              <div className="msg-bubble">{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="msg msg-assistant">
              <div className="msg-bubble msg-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chat-footer">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={user ? 'Pergunte qualquer coisa...' : 'Faz login para enviar mensagens...'}
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Enviar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {showLogin && (
        <div className="chat-modal-overlay" onClick={e => e.target === e.currentTarget && setShowLogin(false)}>
          <div className="chat-modal-box">
            <div className="chat-modal-header">
              <div className="chat-modal-logo">GEIA</div>
              <button className="chat-modal-close" onClick={() => setShowLogin(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="chat-modal-sub">Entra para começares a conversar</p>
            <form onSubmit={handleLogin} className="chat-login-form">
              <div className="chat-form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="o.teu@email.pt"
                  required
                  disabled={loginLoading}
                  autoFocus
                />
              </div>
              <div className="chat-form-field">
                <label>Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••"
                  required
                  disabled={loginLoading}
                />
              </div>
              {loginError && <p className="chat-form-error">{loginError}</p>}
              <button type="submit" className="chat-login-submit" disabled={loginLoading}>
                {loginLoading ? 'A entrar...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
