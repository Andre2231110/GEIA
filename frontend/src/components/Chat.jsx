import { useState, useRef, useEffect, useCallback } from 'react'
import './Chat.css'

const ROLE_LABEL = { aluno: 'Aluno', professor: 'Professor', admin: 'Administrador' }

export default function Chat() {

  const [showMenu, setShowMenu] = useState(false)

  const [showProfile, setShowProfile] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversaId, setConversaId] = useState(null)
  const [conversas, setConversas] = useState([])

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

  const carregarConversas = useCallback(async (u) => {
    if (!u) return
    try {
      const res = await fetch(`/api/conversations/?user_id=${u.id}`)
      setConversas(await res.json())
    } catch { setConversas([]) }
  }, [])

  useEffect(() => {
    carregarConversas(user)
  }, [user, carregarConversas])

  async function abrirConversa(conv) {
    setConversaId(conv.id)
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages/`)
      const data = await res.json()
      setMessages(data)
    } catch { setMessages([]) }
  }

  function novaConversa() {
    setConversaId(null)
    setMessages([])
  }

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
        body: JSON.stringify({ message: text, user_id: user.id, conversation_id: conversaId }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      if (data.conversation_id) {
        setConversaId(data.conversation_id)
        carregarConversas(user)
      }
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
    setConversas([])
    setConversaId(null)
  }

  async function handleChangePassword() {
      setProfileError('')
      setProfileSuccess('')

      if (
        passwordForm.newPassword !==
        passwordForm.confirmPassword
      ) {
        setProfileError('As passwords não coincidem.')
        return
      }

      setSavingProfile(true)

      try {
        const res = await fetch(
          `/api/users/${user.id}/change-password/`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              current_password:
                passwordForm.currentPassword,
              new_password:
                passwordForm.newPassword,
            }),
          }
        )

        const data = await res.json()

        if (res.ok) {
          setProfileSuccess(
            'Password alterada com sucesso.'
          )

          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          })
        } else {
          setProfileError(
            data.error || 'Erro ao alterar password.'
          )
        }
      } catch {
        setProfileError(
          'Erro ao comunicar com o servidor.'
        )
      } finally {
        setSavingProfile(false)
      }
    }

  return (
    <div className="chat-layout">

      <aside className="chat-nav">
        <div className="chat-nav-logo">GEIA</div>

        {user && (
          <button className="chat-nova-btn" onClick={novaConversa}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova conversa
          </button>
        )}

        <div className="chat-conversas">
          {conversas.map(c => (
            <button
              key={c.id}
              className={`chat-conversa-item ${conversaId === c.id ? 'chat-conversa-ativa' : ''}`}
              onClick={() => abrirConversa(c)}
              title={c.title}
            >
              {c.title}
            </button>
          ))}
        </div>

        <div className="chat-nav-footer">
          {user ? (
            <div
                className="chat-account"
                onClick={() => setShowMenu(!showMenu)}
              >
                {showMenu && (
                  <div className="chat-user-menu">
                    <button
                        className="chat-user-menu-item"
                        onClick={() => {
                          setShowProfile(true)
                          setShowMenu(false)
                        }}
                      >
                      Perfil
                    </button>

                    <button className="chat-user-menu-item">
                      Configurações
                    </button>

                    <button
                      className="chat-user-menu-item logout"
                      onClick={handleLogout}
                    >
                      Sair
                    </button>
                  </div>
                )}
              <div className="chat-account-avatar">{user.name[0].toUpperCase()}</div>
              <div className="chat-account-info">
                <p className="chat-account-name">{user.name}</p>
                <p className="chat-account-role">{ROLE_LABEL[user.role] || user.role}</p>
              </div>
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

      {showProfile && (
        <div
          className="chat-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowProfile(false)
            }
          }}
        >
          <div className="profile-modal">
            <div className="profile-header">
              <h2>Perfil</h2>

              <button
                className="profile-close"
                onClick={() => setShowProfile(false)}
              >
                ✕
              </button>
            </div>

            <div className="profile-content">

              <div className="profile-user-section">
                <div className="chat-account-avatar">{user.name[0].toUpperCase()}</div>

                <div>
                  Nome: <h3>{user.name}</h3>
                  E-mail: <p>{user.email}</p>
                  Role: <p>{ROLE_LABEL[user.role] || user.role}</p>
                </div>
              </div>

              <div className="profile-divider" />

              <h3>Alterar password</h3>

              <div className="profile-field">
                <label>Password atual</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div className="profile-field">
                <label>Nova password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div className="profile-field">
                <label>Confirmar password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              {profileError && (
                <p className="profile-error">{profileError}</p>
              )}

              {profileSuccess && (
                <p className="profile-success">{profileSuccess}</p>
              )}

              <button
                className="profile-save-btn"
                onClick={handleChangePassword}
                disabled={savingProfile}
              >
                {savingProfile ? 'A guardar...' : 'Guardar alterações'}
              </button>

            </div>
                </div>
              </div>
            )}

    </div>
  )
}
