import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

function normalizeMath(content = '') {
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
}

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
  const [conversations, setConversations] = useState([])
  const [loadingConversations, setLoadingConversations] = useState(false)

  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async () => {
    if (!teacher?.id) return

    setLoadingConversations(true)

    try {
      const response = await fetch(
        `/api/conversations/?user_id=${teacher.id}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Erro ao carregar as conversas.'
        )
      }

      setConversations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setConversations([])
    } finally {
      setLoadingConversations(false)
    }
  }, [teacher?.id])

  useEffect(() => {
    if (!teacher?.id) {
      navigate('/backoffice')
      return
    }

    async function loadTeacherClasses() {
      try {
        const response = await fetch(
          `/api/teacher/${teacher.id}/classes`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'Erro ao carregar as turmas.'
          )
        }

        const teacherClasses = Array.isArray(data)
          ? data
          : []

        setClasses(teacherClasses)

        if (teacherClasses.length === 1) {
          setSelectedClassroom(
            String(teacherClasses[0].id)
          )
        }
      } catch (err) {
        console.error(err)
        setClasses([])
        setError('Não foi possível carregar as turmas.')
      }
    }

    loadTeacherClasses()
    loadConversations()
  }, [teacher?.id, navigate, loadConversations])

  function newConversation() {
    setConversationId(null)
    setMessages([])
    setMessage('')
    setError('')
  }

  async function openConversation(conversation) {
    if (loadingMessages) return

    setConversationId(conversation.id)
    setMessages([])
    setError('')
    setLoadingMessages(true)

    if (conversation.classroom_id) {
      setSelectedClassroom(
        String(conversation.classroom_id)
      )
    }

    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages/`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Erro ao carregar a conversa.'
        )
      }

      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setMessages([])
      setError('Não foi possível abrir a conversa.')
    } finally {
      setLoadingMessages(false)
    }
  }

  async function sendMessage() {
    const text = message.trim()

    if (!text || loading) return

    if (!teacher?.id) {
      setError('Professor não autenticado.')
      return
    }

    if (!selectedClassroom) {
      setError(
        'Seleciona uma turma antes de enviar a mensagem.'
      )
      return
    }

    setError('')
    setMessage('')

    setMessages(previousMessages => [
      ...previousMessages,
      {
        role: 'user',
        content: text,
      },
    ])

    setLoading(true)

    try {
      const response = await fetch('/api/llmcloud/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          user_id: teacher.id,
          classroom_id: Number(selectedClassroom),
          conversation_id: conversationId,
          model: 'lfm2.5-thinking:latest',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Erro ao enviar a mensagem.'
        )
      }

      setMessages(previousMessages => [
        ...previousMessages,
        {
          role: 'assistant',
          content: data.reply,
        },
      ])

      if (data.conversation_id) {
        setConversationId(data.conversation_id)
        await loadConversations()
      }
    } catch (err) {
      setMessages(previousMessages => [
        ...previousMessages,
        {
          role: 'assistant',
          content:
            err.message ||
            'Erro ao comunicar com o servidor. Tenta novamente.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      sendMessage()
    }
  }

  function handleClassroomChange(event) {
    const nextClassroom = event.target.value

    if (
      conversationId &&
      nextClassroom !== selectedClassroom
    ) {
      newConversation()
    }

    setSelectedClassroom(nextClassroom)
  }

  function handleLogout() {
    localStorage.removeItem('teacher')
    navigate('/backoffice')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* Sidebar */}
      <aside className="flex w-72 shrink-0 flex-col bg-slate-900 text-white">

        {/* Logo */}
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-xl font-bold text-slate-900">
              G
            </div>

            <div>
              <h1 className="text-xl font-bold">
                GEIA
              </h1>

              <p className="text-xs text-slate-400">
                Backoffice
              </p>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="border-b border-slate-800 p-3">
          <button
            type="button"
            onClick={() =>
              navigate('/backoffice/dashboard')
            }
            className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800"
          >
            Dashboard
          </button>

          <button
            type="button"
            className="mt-1 w-full rounded-xl bg-slate-800 px-4 py-2.5 text-left text-sm font-medium text-white"
          >
            Assistente IA
          </button>
        </nav>

        {/* Botão nova conversa */}
        <div className="p-3">
          <button
            type="button"
            onClick={newConversation}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>

            Nova conversa
          </button>
        </div>

        {/* Histórico */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Conversas recentes
          </p>

          {loadingConversations && (
            <p className="px-2 py-3 text-sm text-slate-400">
              A carregar...
            </p>
          )}

          {!loadingConversations &&
            conversations.length === 0 && (
              <p className="px-2 py-3 text-sm text-slate-400">
                Ainda não existem conversas.
              </p>
            )}

          <div className="space-y-1">
            {conversations.map(conversation => {
              const active =
                conversationId === conversation.id

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() =>
                    openConversation(conversation)
                  }
                  className={`w-full truncate rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={
                    conversation.title ||
                    'Nova conversa'
                  }
                >
                  {conversation.title ||
                    'Nova conversa'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Professor */}
        <div className="border-t border-slate-800 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold">
              {teacher?.name?.[0]?.toUpperCase() ||
                'P'}
            </div>

            <div className="min-w-0">
              <p className="truncate font-medium">
                {teacher?.name || 'Professor'}
              </p>

              <p className="truncate text-xs text-slate-400">
                Professor
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl bg-slate-800 py-2 text-sm hover:bg-slate-700"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Área do chat */}
      <main className="flex min-w-0 flex-1 flex-col">

        {/* Cabeçalho */}
        <header className="flex items-center justify-between gap-6 border-b border-slate-200 bg-white px-8 py-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Assistente IA
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Coloque questões utilizando a informação
              contextual da turma.
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
              onChange={handleClassroomChange}
              className="min-w-52 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="">
                Selecionar turma
              </option>

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
          <div className="mx-auto max-w-4xl space-y-4">

            {loadingMessages && (
              <div className="flex justify-center pt-24">
                <p className="text-sm text-slate-500">
                  A carregar conversa...
                </p>
              </div>
            )}

            {!loadingMessages &&
              messages.length === 0 && (
                <div className="flex items-center justify-center pt-24">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">
                      Assistente do professor
                    </h3>

                    <p className="mt-2 max-w-md text-slate-500">
                      Selecione uma turma e coloque uma
                      pergunta sobre os alunos, as
                      dificuldades ou os temas abordados.
                    </p>
                  </div>
                </div>
              )}

            {!loadingMessages &&
              messages.map((currentMessage, index) => {
                const isTeacher =
                  currentMessage.role === 'teacher' ||
                  currentMessage.role === 'user'

                return (
                  <div
                    key={
                      currentMessage.id || index
                    }
                    className={`flex ${
                      isTeacher
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 leading-relaxed ${
                        isTeacher
                          ? 'whitespace-pre-wrap rounded-br-sm bg-blue-600 text-white'
                          : 'msg-assistant-content rounded-bl-sm border border-slate-200 bg-white text-slate-800 shadow-sm'
                      }`}
                    >
                      {isTeacher ? (
                        currentMessage.content
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[
                            [rehypeKatex, { throwOnError: false }],
                          ]}
                        >
                          {normalizeMath(currentMessage.content)}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                )
              })}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-slate-500 shadow-sm">
                  A analisar a informação da turma...
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Input */}
        <footer className="border-t border-slate-200 bg-white p-5">
          <div className="mx-auto max-w-4xl">
            {error && (
              <p className="mb-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex items-end gap-3">
              <textarea
                value={message}
                onChange={event =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedClassroom
                    ? 'Pergunte algo sobre a turma...'
                    : 'Selecione primeiro uma turma...'
                }
                disabled={
                  loading || !selectedClassroom
                }
                rows={1}
                className="min-h-12 max-h-36 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={
                  loading ||
                  !message.trim() ||
                  !selectedClassroom
                }
                className="h-12 rounded-xl bg-blue-600 px-6 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'A enviar...'
                  : 'Enviar'}
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}