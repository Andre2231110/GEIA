import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function timeAgo(isoDate) {
  const diff = Math.floor((Date.now() - new Date(isoDate)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  return `há ${Math.floor(diff / 86400)} d`
}

function DoubtItem({ d,
    onOpen,
    onReply,
    onMarkRead }) {
  
  const [showReply, setShowReply] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  


  async function handleReply(e) {
    e.preventDefault()

    const cleanReply = reply.trim()

    if (!cleanReply) {
      setError('Escreva uma resposta.')
      return
    }

    setSending(true)
    setError('')

    try {
      await onReply(d.id, cleanReply)
      setReply('')
      setShowReply(false)
    } catch (err) {
      setError(err.message || 'Erro ao enviar a resposta.')
    } finally {
      setSending(false)
    }
  }

  return (
  <div
    className={`flex gap-3 rounded-xl border px-4 py-2.5 ${
      d.is_read
        ? 'border-slate-200 bg-white'
        : 'border-amber-300 bg-amber-50'
    }`}
  >
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
      {d.student_name?.[0]?.toUpperCase() || 'A'}
    </div>

    <div className="min-w-0 flex-1">
      <div className="text-sm font-medium text-slate-800">
        {d.description}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{d.student_name}</span>
        <span>·</span>
        <span>{d.class_name}</span>
        <span>·</span>
        <span>{timeAgo(d.created_at)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {d.messages?.length > 0 && (
          <button
            type="button"
            onClick={() => onOpen(d)}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>

            Ver conversa
          </button>
        )}

        {!showReply && (
          <button
            type="button"
            onClick={() => setShowReply(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {d.teacher_reply
              ? 'Responder novamente'
              : 'Responder'}
          </button>
        )}
      </div>

      {d.teacher_reply && !showReply && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-green-800">
              Resposta enviada
            </p>

            {d.replied_at && (
              <span className="text-xs text-green-700">
                {timeAgo(d.replied_at)}
              </span>
            )}
          </div>

          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
            {d.teacher_reply}
          </p>
        </div>
      )}

      {showReply && (
        <form
          onSubmit={handleReply}
          className="mt-3"
        >
          <textarea
            value={reply}
            onChange={e => {
              setReply(e.target.value)
              setError('')
            }}
            rows={3}
            placeholder="Escreva a resposta para o aluno..."
            disabled={sending}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
          />

          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending
                ? 'A enviar...'
                : 'Enviar resposta'}
            </button>

            <button
              type="button"
              disabled={sending}
              onClick={() => {
                setShowReply(false)
                setReply('')
                setError('')
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>

    {!d.is_read && (
      <button
        type="button"
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
  const [selectedDoubt, setSelectedDoubt] = useState(null)
  

  useEffect(() => {
    if (!teacher?.id) {
      navigate('/backoffice')
      return
    }

    fetch(`/api/teacher/${teacher.id}/stats`)
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
    const response = await fetch(
      `/api/teacher/doubts/${id}/mark-read/`,
      {
        method: 'PATCH',
      }
    )

    if (!response.ok) {
      throw new Error('Não foi possível marcar a dúvida como lida.')
    }

    setDoubts(prev =>
      prev.filter(doubt => doubt.id !== id)
    )
  }

  async function replyDoubt(doubtId, reply) {
    const response = await fetch(
      `/api/teacher/doubts/${doubtId}/reply/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_id: teacher.id,
          reply,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.error || 'Não foi possível enviar a resposta.'
      )
    }

    setDoubts(prev =>
      prev.filter(doubt => doubt.id !== doubtId)
    )
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

          <button
            onClick={() => navigate('/teacher/chat')}
            className="w-full text-left px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800"
            >
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
        <header className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Bem-vindo, {teacher?.name}. Aqui pode acompanhar as suas turmas.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Turmas
            </p>

            <h3 className="mt-1 text-3xl font-bold text-slate-900">
              {stats.total_turmas}
            </h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Alunos
            </p>

            <h3 className="mt-1 text-3xl font-bold text-slate-900">
              {stats.total_alunos}
            </h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Conversas
            </p>

            <h3 className="mt-1 text-3xl font-bold text-slate-900">
              {stats.total_conversas}
            </h3>
          </div>

          <div
            className={`rounded-xl border p-4 shadow-sm ${
              unread > 0
                ? 'border-amber-300 bg-amber-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Dúvidas
            </p>

            <h3 className="mt-1 text-3xl font-bold text-slate-900">
              {unread}
            </h3>
          </div>
        </section>

        <section className="mb-8 flex h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex shrink-0 items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>

              <h3 className="text-xl font-bold text-slate-900">
                Dúvidas dos Alunos
              </h3>

              {unread > 0 && (
                <span className="ml-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-medium text-slate-900">
                  {unread} nova{unread !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loadingD && (
              <p className="text-sm text-slate-500">
                A carregar...
              </p>
            )}

            {!loadingD && doubts.length === 0 && (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-slate-500">
                  Nenhuma dúvida recebida ainda.
                </p>
              </div>
            )}

            {!loadingD && doubts.length > 0 && (
              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <div className="space-y-2">
                  {doubts.map(d => (
                    <DoubtItem
                      key={d.id}
                      d={d}
                      onOpen={setSelectedDoubt}
                      onMarkRead={markRead}
                      onReply={replyDoubt}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        {selectedDoubt && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
              onClick={() => setSelectedDoubt(null)}
            >
              <div
                className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Dúvida do aluno
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedDoubt.student_name}
                      {' · '}
                      {selectedDoubt.class_name}
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {selectedDoubt.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedDoubt(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Fechar"
                  >
                    ×
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
                  {selectedDoubt.messages?.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDoubt.messages.map((m, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border p-4 ${
                            m.role === 'user'
                              ? 'border-slate-200 bg-white'
                              : 'border-blue-100 bg-blue-50'
                          }`}
                        >
                          <div className="mb-2 font-semibold text-slate-900">
                            {m.role === 'user'
                              ? selectedDoubt.student_name
                              : 'Assistente IA'}
                          </div>

                          <div className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                            {m.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Esta dúvida não tem uma conversa associada.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setSelectedDoubt(null)}
                    className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  )
}
