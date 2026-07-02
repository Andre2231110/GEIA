import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
    <div className={`flex gap-3 p-4 rounded-xl border ${d.is_read ? 'border-slate-200' : 'border-amber-300 bg-amber-50'}`}>
      <div className="w-9 h-9 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
        {d.student_name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-slate-800">{d.description}</div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
          <span>{d.student_name}</span>
          <span>·</span>
          <span>{d.class_name}</span>
          <span>·</span>
          <span>{timeAgo(d.created_at)}</span>
        </div>

        {d.messages && d.messages.length > 0 && (
          <div className="mt-2">
            <button
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              onClick={() => setExpanded(v => !v)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              {expanded ? 'Ocultar conversa' : `Ver conversa "${d.conversation_title || 'sem título'}"`}
            </button>

            {expanded && (
              <div className="mt-2 space-y-2 border-t border-slate-200 pt-2">
                {d.messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'text-slate-700' : 'text-slate-500'}>
                    <span className="font-medium mr-2">{m.role === 'user' ? d.student_name.split(' ')[0] : 'IA'}</span>
                    <span>{m.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {!d.is_read && (
        <button
          className="self-start shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700"
          onClick={() => onMarkRead(d.id)}
        >
          Marcar como lida
        </button>
      )}
    </div>
  )
}

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [teacher] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teacher')) } catch { return null }
  })

  const [stats, setStats] = useState({ total_turmas: 0, total_alunos: 0, total_conversas: 0 })
  const [doubts, setDoubts] = useState([])
  const [loadingD, setLoadingD] = useState(true)

  useEffect(() => {
    if (!teacher?.id) {
      navigate('/backoffice')
      return
    }

    fetch(`/api/teacher/${teacher.id}/stats/`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})

    fetch(`/api/teacher/${teacher.id}/doubts/`)
      .then(r => r.json())
      .then(d => setDoubts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingD(false))
  }, [teacher, navigate])

  async function markRead(id) {
    await fetch(`/api/teacher/doubts/${id}/mark-read/`, { method: 'PATCH' })
    setDoubts(prev => prev.map(d => d.id === id ? { ...d, is_read: true } : d))
  }

  function handleLogout() {
    localStorage.removeItem('teacher')
    navigate('/backoffice')
  }

  const unread = doubts.filter(d => !d.is_read).length

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-72 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xl">
              G
            </div>
            <div>
              <h1 className="font-bold text-xl">GEIA</h1>
              <p className="text-xs text-slate-400">Backoffice</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 font-medium">
            Dashboard
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800">
            Turmas
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800">
            Alunos
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800">
            Assistente IA
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {teacher?.name?.[0]?.toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="font-medium truncate">{teacher?.name}</p>
              <p className="text-xs text-slate-400 truncate">Professor</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-slate-800 py-2 text-sm hover:bg-slate-700"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Dashboard
          </h2>
          <p className="text-slate-500 mt-1">
            Bem-vindo, {teacher?.name}. Aqui pode acompanhar as suas turmas.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Turmas</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2">
              {stats.total_turmas}
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Alunos</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2">
              {stats.total_alunos}
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Conversas</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2">
              {stats.total_conversas}
            </h3>
          </div>

          <div className={`rounded-2xl p-6 shadow-sm border ${unread > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
            <p className="text-sm text-slate-500">Dúvidas por responder</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2">
              {unread}
            </h3>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h3 className="text-xl font-bold text-slate-900">Dúvidas dos Alunos</h3>
            {unread > 0 && (
              <span className="ml-1 text-xs font-medium bg-amber-400 text-slate-900 rounded-full px-2 py-0.5">
                {unread} nova{unread !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loadingD && <p className="text-slate-500 text-sm">A carregar...</p>}
          {!loadingD && doubts.length === 0 && (
            <p className="text-slate-500 text-sm">Nenhuma dúvida recebida ainda.</p>
          )}
          {!loadingD && doubts.length > 0 && (
            <div className="space-y-3">
              {doubts.map(d => <DoubtItem key={d.id} d={d} onMarkRead={markRead} />)}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Resumo das turmas
          </h3>
          <p className="text-slate-500">
            Nesta primeira versão, esta área vai mostrar estatísticas gerais.
            Depois podemos ligar aqui os dados processados da `processed_db`.
          </p>
        </section>
      </main>
    </div>
  )
}
