import { useState, useEffect } from 'react'
import './TeacherDashboard.css'

function timeAgo(isoDate) {
  const diff = Math.floor((Date.now() - new Date(isoDate)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  return `há ${Math.floor(diff / 86400)} d`
}

function DoubtItem({ d, onMarkRead }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`teacher-doubt-item ${d.is_read ? '' : 'teacher-doubt-unread'}`}>
      <div className="teacher-q-avatar">{d.student_name[0].toUpperCase()}</div>
      <div className="teacher-q-content" style={{ flex: 1, minWidth: 0 }}>
        <div className="teacher-doubt-description">{d.description}</div>
        <div className="teacher-q-meta">
          <span>{d.student_name}</span>
          <span className="teacher-q-dot">·</span>
          <span>{d.class_name}</span>
          <span className="teacher-q-dot">·</span>
          <span>{timeAgo(d.created_at)}</span>
        </div>

        {d.messages && d.messages.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button className="teacher-expand-btn" onClick={() => setExpanded(v => !v)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              {expanded ? 'Ocultar conversa' : `Ver conversa "${d.conversation_title || 'sem título'}"`}
            </button>

            {expanded && (
              <div className="teacher-chat-preview">
                {d.messages.map((m, i) => (
                  <div key={i} className={`teacher-chat-msg ${m.role}`}>
                    <span className="teacher-chat-role">{m.role === 'user' ? d.student_name.split(' ')[0] : 'IA'}</span>
                    <p>{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {!d.is_read && (
        <button className="teacher-mark-read" onClick={() => onMarkRead(d.id)}>
          Marcar como lida
        </button>
      )}
    </div>
  )
}

export default function TeacherDashboard() {
  const [teacher] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teacher')) } catch { return null }
  })

  const [stats, setStats] = useState({ total_turmas: 0, total_alunos: 0, total_conversas: 0 })
  const [doubts, setDoubts] = useState([])
  const [loadingD, setLoadingD] = useState(true)

  useEffect(() => {
    if (!teacher?.id) { setLoadingD(false); return }

    fetch(`/api/teacher/${teacher.id}/stats`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})

    fetch(`/api/teacher/${teacher.id}/doubts/`)
      .then(r => r.json())
      .then(d => setDoubts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingD(false))
  }, [teacher?.id])

  async function markRead(id) {
    await fetch(`/api/teacher/doubts/${id}/mark-read/`, { method: 'PATCH' })
    setDoubts(prev => prev.map(d => d.id === id ? { ...d, is_read: true } : d))
  }

  const unread = doubts.filter(d => !d.is_read).length

  return (
    <div className="teacher-layout">
      <aside className="teacher-sidebar">
        <div className="teacher-logo">GEIA</div>
        <nav className="teacher-nav">
          <button>Dashboard</button>
          <button>Turmas</button>
          <button>Alunos</button>
          <button>Assistente IA</button>
        </nav>
        <div className="teacher-user">
          <div className="teacher-avatar">{teacher?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="teacher-name">{teacher?.name}</div>
            <div className="teacher-role">Professor</div>
          </div>
        </div>
      </aside>

      <main className="teacher-main">
        <h1>Bem-vindo, {teacher?.name}</h1>

        <div className="teacher-cards">
          <div className="teacher-card"><h2>Turmas</h2><p>{stats.total_turmas}</p></div>
          <div className="teacher-card"><h2>Alunos</h2><p>{stats.total_alunos}</p></div>
          <div className="teacher-card"><h2>Conversas</h2><p>{stats.total_conversas}</p></div>
          <div className={`teacher-card ${unread > 0 ? 'teacher-card-alert' : ''}`}>
            <h2>Dúvidas por responder</h2>
            <p>{unread}</p>
          </div>
        </div>

        <div className="teacher-section">
          <div className="teacher-section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h2>Dúvidas dos Alunos</h2>
            {unread > 0 && <span className="teacher-badge">{unread} nova{unread !== 1 ? 's' : ''}</span>}
          </div>

          {loadingD && <p className="teacher-empty">A carregar...</p>}
          {!loadingD && doubts.length === 0 && (
            <p className="teacher-empty">Nenhuma dúvida recebida ainda.</p>
          )}
          {!loadingD && doubts.length > 0 && (
            <div className="teacher-doubts">
              {doubts.map(d => <DoubtItem key={d.id} d={d} onMarkRead={markRead} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
