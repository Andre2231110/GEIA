import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function TeacherChat() {
  const navigate = useNavigate()

  const [teacher] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('teacher'))
    } catch {
      return null
    }
  })

  const [classes, setClasses] = useState([])
    const [selectedClassroom, setSelectedClassroom] = useState('')

    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])

    const [conversationId, setConversationId] = useState(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

  useEffect(() => {
    if (!teacher?.id) {
      navigate('/backoffice')
      return
    }

    async function loadTeacherClasses() {
      try {
        const res = await fetch(
          `/api/teacher/${teacher.id}/classes`
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao carregar as turmas.')
        }

        const teacherClasses = Array.isArray(data) ? data : []

        setClasses(teacherClasses)

        if (teacherClasses.length === 1) {
          setSelectedClassroom(String(teacherClasses[0].id))
        }
      } catch {
        setClasses([])
        setError('Não foi possível carregar as turmas.')
      }
    }

    loadTeacherClasses()
  }, [teacher, navigate])

  async function sendMessage() {
  const text = message.trim()

  if (!text || loading) return

  if (!teacher?.id) {
    setError('Professor não autenticado.')
    return
  }

  if (!selectedClassroom) {
    setError('Seleciona uma turma antes de enviar a mensagem.')
    return
  }

  setError('')
  setMessage('')

  setMessages(prev => [
    ...prev,
    {
      role: 'teacher',
      content: text,
    },
  ])

  setLoading(true)

  try {
    const res = await fetch('/api/llmcloud/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: text,
        user_id: teacher.id,
        classroom_id: Number(selectedClassroom),
        conversation_id: conversationId || null,
        model: 'lfm2.5-thinking:latest',
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Erro ao enviar a mensagem.')
    }

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: data.reply,
      },
    ])

    if (data.conversation_id) {
      setConversationId(data.conversation_id)
    }
  } catch (error) {
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content:
          error.message ||
          'Erro ao comunicar com o servidor. Tenta novamente.',
      },
    ])
  } finally {
    setLoading(false)
  }
}

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  function handleLogout() {
    localStorage.removeItem('teacher')
    navigate('/backoffice')
  }

  return (
    <div className="h-screen bg-slate-100 flex overflow-hidden">
      {/* Sidebar do Backoffice */}
      <aside className="w-72 shrink-0 bg-slate-900 text-white flex flex-col">
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
          <button
            onClick={() => navigate('/backoffice/dashboard')}
            className="w-full text-left px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800"
          >
            Dashboard
          </button>


          <button
            className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 text-white font-medium"
          >
            Assistente IA
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {teacher?.name?.[0]?.toUpperCase() || 'P'}
            </div>

            <div className="min-w-0">
              <p className="font-medium truncate">
                {teacher?.name || 'Professor'}
              </p>

              <p className="text-xs text-slate-400 truncate">
                Professor
              </p>
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

      {/* Área do Teacher Chat */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Assistente IA
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Coloque questões utilizando a informação contextual da turma.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="classroom"
              className="text-xs font-medium text-slate-500"
            >
              Turma
            </label>

            <select
              id="classroom"
              value={selectedClassroom}
              onChange={event =>
                setSelectedClassroom(event.target.value)
              }
              className="min-w-52 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="">Selecionar turma</option>

              {classes.map(classroom => (
                <option
                  key={classroom.id}
                  value={classroom.id}
                >
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Mensagens */}
        <section className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center pt-24">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    Assistente do professor
                  </h3>

                  <p className="text-slate-500 mt-2 max-w-md">
                    Selecione uma turma e coloque uma pergunta sobre os
                    alunos, as dificuldades ou os temas abordados.
                  </p>
                </div>
              </div>
            )}

            {messages.map((currentMessage, index) => (
              <div
                key={index}
                className={`flex ${
                  currentMessage.role === 'teacher'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                    currentMessage.role === 'teacher'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {currentMessage.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm text-slate-500">
                  A analisar a informação da turma...
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Input */}
        <footer className="bg-white border-t border-slate-200 p-5">
          <div className="max-w-4xl mx-auto">
            {error && (
              <p className="text-sm text-red-600 mb-2">
                {error}
              </p>
            )}

            <div className="flex items-end gap-3">
              <textarea
                value={message}
                onChange={event => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedClassroom
                    ? 'Pergunte algo sobre a turma...'
                    : 'Selecione primeiro uma turma...'
                }
                disabled={loading || !selectedClassroom}
                rows={1}
                className="flex-1 min-h-12 max-h-36 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />

              <button
                onClick={sendMessage}
                disabled={
                  loading ||
                  !message.trim() ||
                  !selectedClassroom
                }
                className="h-12 bg-blue-600 text-white px-6 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'A enviar...' : 'Enviar'}
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}