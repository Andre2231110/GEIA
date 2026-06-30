import { useEffect, useState } from 'react'
import './AlarmingMessagesSection.css'

function timeAgo(isoString) {
  const diff = (Date.now() - new Date(isoString)) / 1000
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return new Date(isoString).toLocaleDateString('pt-PT')
}

function UserInitials({ name }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#dc2626', '#d97706', '#7c3aed', '#db2777', '#b45309']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className="alarm-avatar" style={{ background: color }}>{initials}</div>
  )
}

export default function AlarmingMessagesSection() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchMessages() {
    try {
      const res = await fetch('/api/alarming-messages/')
      setMessages(await res.json())
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkRead(id) {
    await fetch(`/api/alarming-messages/${id}/mark-read/`, { method: 'POST' })
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
  }

  async function handleMarkAllRead() {
    const unread = messages.filter(m => !m.is_read)
    await Promise.all(unread.map(m =>
      fetch(`/api/alarming-messages/${m.id}/mark-read/`, { method: 'POST' })
    ))
    setMessages(prev => prev.map(m => ({ ...m, is_read: true })))
  }

  const filtered = filter === 'unread'
    ? messages.filter(m => !m.is_read)
    : messages

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
    <section className="content-section">
      <div className="section-header">
        <div className="alarm-title-row">
          <svg className="alarm-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h1>Mensagens Alarmantes</h1>
          {unreadCount > 0 && (
            <span className="alarm-count-badge">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="alarm-header-actions">
          <div className="alarm-filter-pills">
            {[['all', 'Todas'], ['unread', 'Não lidas']].map(([v, l]) => (
              <button
                key={v}
                className={`pill ${filter === v ? 'pill-active' : ''}`}
                onClick={() => setFilter(v)}
              >
                {l}
                {v === 'unread' && unreadCount > 0 && (
                  <span className="pill-badge">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={handleMarkAllRead}>
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {loading && <p className="empty-msg">A carregar...</p>}

        {!loading && messages.length === 0 && (
          <div className="alarm-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p>Sem mensagens alarmantes registadas.</p>
          </div>
        )}

        {!loading && filtered.length === 0 && messages.length > 0 && (
          <p className="empty-msg">Nenhuma mensagem não lida.</p>
        )}

        {filtered.length > 0 && (
          <ul className="alarm-list">
            {filtered.map(m => (
              <li key={m.id} className={`alarm-item ${m.is_read ? 'alarm-item-read' : 'alarm-item-unread'}`}>
                <div className="alarm-item-left">
                  {!m.is_read && <span className="alarm-dot" />}
                  <UserInitials name={m.user_name} />
                  <div className="alarm-info">
                    <div className="alarm-meta">
                      <span className="alarm-user-name">{m.user_name}</span>
                      {m.user_email && <span className="alarm-user-email">{m.user_email}</span>}
                      <span className="alarm-time">{timeAgo(m.created_at)}</span>
                    </div>
                    <p className="alarm-message">{m.message}</p>
                  </div>
                </div>
                {!m.is_read && (
                  <button className="alarm-read-btn" onClick={() => handleMarkRead(m.id)} title="Marcar como lida">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
