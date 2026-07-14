import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import './Chat.css'

function timeAgo(isoDate) {
  const diff = Math.floor((Date.now() - new Date(isoDate)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  return `há ${Math.floor(diff / 86400)} d`
}

function normalizeMath(content) {
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
}

const ROLE_LABEL = { aluno: 'Aluno', professor: 'Professor', admin: 'Administrador' }

const inputCls = 'bg-white border border-[#c3c4c7] rounded px-3 py-[9px] text-[14px] text-[#1d2327] font-[inherit] outline-none transition-colors focus:border-[#2271b1] placeholder:text-[#8c8f94] disabled:opacity-50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] w-full'

export default function Chat() {
  const [showMenu, setShowMenu] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-oss:20b-cloud')
  const [studentClasses, setStudentClasses] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [showClassMenu, setShowClassMenu] = useState(false)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const MODELS = [
    { id: 'gpt-oss:20b-cloud', name: 'GPT OSS 20B', desc: 'Modelo mais poderoso para tarefas complexas' },
    { id: 'ministral-3:14b-cloud', name: 'Ministral 3 14B', desc: 'Eficiente para tarefas do dia a dia' },
    { id: 'qwen3-coder:480b-cloud', name: 'Qwen3 Coder 480B', desc: 'O mais rápido para respostas imediatas' },
  ]
  const [conversaId, setConversaId] = useState(null)
  const [conversas, setConversas] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [activeTab, setActiveTab] = useState('minhas')
  const [conversasPartilhadas, setConversasPartilhadas] = useState([])
  const [conversasArquivadas, setConversasArquivadas] = useState([])
  const [sharedByName, setSharedByName] = useState(null)
  const [shareConvId, setShareConvId] = useState(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareError, setShareError] = useState('')
  const [shareSuccess, setShareSuccess] = useState('')
  const [shareLoading, setShareLoading] = useState(false)

  const [teacherDoubts, setTeacherDoubts] = useState([])
  const [openDoubt, setOpenDoubt] = useState(null)
  const [convExpanded, setConvExpanded] = useState(false)

  const [studentReplies, setStudentReplies] = useState([])
  const [openReply, setOpenReply] = useState(null)
  const [seenReplyIds, setSeenReplyIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('seenReplyIds') || '[]')) } catch { return new Set() }
  })

  const [doubtThread, setDoubtThread] = useState([])
  const [threadInput, setThreadInput] = useState('')
  const [threadSending, setThreadSending] = useState(false)

  const [showDoubtModal, setShowDoubtModal] = useState(false)
  const [doubtMessage, setDoubtMessage] = useState('')
  const [doubtClasses, setDoubtClasses] = useState([])
  const [doubtClassId, setDoubtClassId] = useState('')
  const [doubtError, setDoubtError] = useState('')
  const [doubtSuccess, setDoubtSuccess] = useState('')
  const [doubtLoading, setDoubtLoading] = useState(false)

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chatUser')) } catch { return null }
  })
  const [showLogin, setShowLogin] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const doubtBottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (menuOpenId === null) return
    function fechar() { setMenuOpenId(null) }
    document.addEventListener('click', fechar)
    return () => document.removeEventListener('click', fechar)
  }, [menuOpenId])

  useEffect(() => {
    if (!showModelMenu) return
    function fechar() { setShowModelMenu(false) }
    document.addEventListener('click', fechar)
    return () => document.removeEventListener('click', fechar)
  }, [showModelMenu])

  const carregarConversas = useCallback(async (u) => {
    if (!u) return
    try {
      const res = await fetch(`/api/conversations/?user_id=${u.id}`)
      setConversas(await res.json())
    } catch { setConversas([]) }
  }, [])

  const carregarPartilhadas = useCallback(async (u) => {
    if (!u) return
    try {
      const res = await fetch(`/api/conversations/shared/?user_id=${u.id}`)
      setConversasPartilhadas(await res.json())
    } catch { setConversasPartilhadas([]) }
  }, [])

  const carregarArquivadas = useCallback(async (u) => {
    if (!u) return
    try {
      const res = await fetch(`/api/conversations/archived/?user_id=${u.id}`)
      setConversasArquivadas(await res.json())
    } catch { setConversasArquivadas([]) }
  }, [])

  const carregarDuvidasProfessor = useCallback(async (u) => {
    if (!u || u.role !== 'professor') return
    try {
      const res = await fetch(`/api/teacher/${u.id}/doubts/`)
      const data = await res.json()
      setTeacherDoubts(Array.isArray(data) ? data : [])
    } catch { setTeacherDoubts([]) }
  }, [])

  const carregarRespostasAluno = useCallback(async (u) => {
    if (!u || u.role !== 'aluno') return
    try {
      const res = await fetch(`/api/student/doubts/?student_id=${u.id}`)
      const data = await res.json()
      setStudentReplies(Array.isArray(data) ? data : [])
    } catch { setStudentReplies([]) }
  }, [])

  useEffect(() => {
  if (!user) return;

  loadStudentClasses(user.id);
  carregarConversas(user);
  carregarPartilhadas(user);
  carregarArquivadas(user);
  carregarDuvidasProfessor(user);
  carregarRespostasAluno(user);

}, [
  user,
  carregarConversas,
  carregarPartilhadas,
  carregarArquivadas,
  carregarDuvidasProfessor,
  carregarRespostasAluno,
]);
  async function handleShare(e) {
    e.preventDefault()
    setShareError('')
    setShareSuccess('')
    setShareLoading(true)
    try {
      const res = await fetch(`/api/conversations/${shareConvId}/share/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: shareEmail, user_id: user.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setShareSuccess('Conversa partilhada com sucesso!')
        setShareEmail('')
      } else {
        setShareError(data.error || 'Erro ao partilhar.')
      }
    } catch {
      setShareError('Erro ao comunicar com o servidor.')
    } finally {
      setShareLoading(false)
    }
  }

  async function abrirConversa(conv, partilhada = false) {
    setOpenDoubt(null)
    setOpenReply(null)
    setConversaId(conv.id)
    setSharedByName(partilhada ? (conv.shared_by_name || null) : null)
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages/`)
      setMessages(await res.json())
    } catch { setMessages([]) }
  }

  function novaConversa() {
    setOpenDoubt(null)
    setOpenReply(null)
    setConversaId(null)
    setMessages([])
    setSharedByName(null)
    setActiveTab('minhas')
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function iniciarEdicao(e, conv) {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditingTitle(conv.title)
  }

  async function guardarTitulo(id) {
    const titulo = editingTitle.trim()
    if (!titulo) { setEditingId(null); return }
    try {
      await fetch(`/api/conversations/${id}/rename/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titulo }),
      })
      setConversas(prev => prev.map(c => c.id === id ? { ...c, title: titulo } : c))
    } catch { }
    setEditingId(null)
  }

  function handleEditKeyDown(e, id) {
    if (e.key === 'Enter') { e.preventDefault(); guardarTitulo(id) }
    if (e.key === 'Escape') setEditingId(null)
  }

  async function arquivarConversa(id) {
    setMenuOpenId(null)
    try {
      await fetch(`/api/conversations/${id}/archive/`, { method: 'PATCH' })
      const conv = conversas.find(c => c.id === id)
      setConversas(prev => prev.filter(c => c.id !== id))
      if (conv) setConversasArquivadas(prev => [conv, ...prev])
      if (conversaId === id) { setConversaId(null); setMessages([]) }
    } catch { }
  }

  async function marcarDuvidaLida(id) {
    try {
      await fetch(`/api/teacher/doubts/${id}/mark-read/`, { method: 'PATCH' })
      setTeacherDoubts(prev => prev.map(d => d.id === id ? { ...d, is_read: true } : d))
    } catch { }
  }

  useEffect(() => {
    const id = openDoubt?.id || openReply?.id
    setThreadInput('')
    setConvExpanded(false)
    if (!id) { setDoubtThread([]); return }
    fetch(`/api/doubts/${id}/messages/`)
      .then(r => r.json())
      .then(d => setDoubtThread(Array.isArray(d) ? d : []))
      .catch(() => setDoubtThread([]))
  }, [openDoubt?.id, openReply?.id])

  useEffect(() => {
    doubtBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [doubtThread])

  async function enviarMensagemThread() {
    const conteudo = threadInput.trim()
    if (!conteudo || !user) return
    const id = openDoubt?.id || openReply?.id
    if (!id) return
    setThreadSending(true)
    try {
      const res = await fetch(`/api/doubts/${id}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user.id, content: conteudo }),
      })
      const data = await res.json()
      if (res.ok) {
        setDoubtThread(prev => [...prev, data])
        setThreadInput('')
        if (user.role === 'professor' && openDoubt && !openDoubt.teacher_reply) {
          setOpenDoubt(prev => ({ ...prev, teacher_reply: conteudo, is_read: true }))
          setTeacherDoubts(prev => prev.map(d => d.id === id ? { ...d, teacher_reply: conteudo, is_read: true } : d))
        }
      }
    } catch { }
    finally { setThreadSending(false) }
  }

  async function desarquivarConversa(id) {
    try {
      await fetch(`/api/conversations/${id}/unarchive/`, { method: 'PATCH' })
      const conv = conversasArquivadas.find(c => c.id === id)
      setConversasArquivadas(prev => prev.filter(c => c.id !== id))
      if (conv) setConversas(prev => [conv, ...prev])
    } catch { }
  }

  async function loadStudentClasses(studentId) {
    try {
      const res = await fetch(`/api/student/classes/?student_id=${studentId}`)
      const data = await res.json()

      setStudentClasses(data)

      if (data.length === 1) {
        setSelectedClassroom(String(data[0].id))
      }

    } catch {
      setStudentClasses([])
    }
  }

  async function abrirModalDuvida() {
    setDoubtMessage('')
    setDoubtError('')
    setDoubtSuccess('')
    setDoubtClassId('')
    try {
      const res = await fetch(`/api/student/classes/?student_id=${user.id}`)
      const data = await res.json()
      setDoubtClasses(data)
      if (data.length === 1) setDoubtClassId(String(data[0].id))
    } catch { setDoubtClasses([]) }
    setShowDoubtModal(true)
  }

  async function submeterDuvida(e) {
    e.preventDefault()
    setDoubtError('')
    if (!doubtMessage.trim()) { setDoubtError('Escreve uma descrição do que não percebeste.'); return }
    if (!doubtClassId) { setDoubtError('Seleciona uma turma.'); return }
    setDoubtLoading(true)
    try {
      const res = await fetch('/api/student/doubts/submit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          classroom_id: doubtClassId,
          description: doubtMessage,
          conversation_id: conversaId || null,
        }),
      })
      if (res.ok) {
        setDoubtSuccess('Dúvida enviada ao professor!')
        setTimeout(() => setShowDoubtModal(false), 1500)
      } else {
        const d = await res.json()
        setDoubtError(d.error || 'Erro ao enviar.')
      }
    } catch { setDoubtError('Erro ao comunicar com o servidor.') }
    finally { setDoubtLoading(false) }
  }

  async function eliminarConversa(id) {
    try {
      await fetch(`/api/conversations/${id}/delete/`, { method: 'DELETE' })
      setConversas(prev => prev.filter(c => c.id !== id))
      if (conversaId === id) { setConversaId(null); setMessages([]) }
    } catch { }
    setConfirmDeleteId(null)
  }

  async function sendMessage() {
    console.log(selectedClassroom);
    const text = input.trim()
    if (!text || loading) return
    if (!user) { setShowLogin(true); return }
    setInput('')
    textareaRef.current.style.height = 'auto'
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await fetch('/api/llmcloud/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, user_id: user.id, conversation_id: conversaId,classroom_id: selectedClassroom, model: selectedModel }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      if (data.conversation_id) { setConversaId(data.conversation_id); carregarConversas(user) }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao comunicar com o servidor. Tenta novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
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
    setOpenDoubt(null)
    setOpenReply(null)
    setTeacherDoubts([])
    setStudentReplies([])
    setDoubtThread([])
    setThreadInput('')
    setActiveTab('minhas')
    setSeenReplyIds(new Set())
    localStorage.removeItem('seenReplyIds')
  }

  async function handleChangePassword() {
    setProfileError('')
    setProfileSuccess('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setProfileError('As passwords não coincidem.')
      return
    }
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/users/${user.id}/change-password/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: passwordForm.currentPassword, new_password: passwordForm.newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfileSuccess('Password alterada com sucesso.')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setProfileError(data.error || 'Erro ao alterar password.')
      }
    } catch {
      setProfileError('Erro ao comunicar com o servidor.')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="flex h-dvh bg-[#dcdcde] text-[#1d2327]">

      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#0f0f0f] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <span className="text-[18px] font-bold text-[#f0a500] tracking-tight">GEIA</span>
          {user && (
            <button
              className="w-8 h-8 flex items-center justify-center bg-transparent border-none text-[#8e8ea0] hover:text-white hover:bg-[#2a2a2a] rounded-lg cursor-pointer transition-colors"
              onClick={novaConversa}
              title="Nova conversa"
            >
              <svg className="w-4.25 h-4.25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-2 pb-2 shrink-0 flex-wrap">
          {[
            { id: 'minhas', label: 'Minhas' },
            { id: 'partilhadas', label: 'Partilhadas' },
            { id: 'arquivadas', label: 'Arquivadas' },
            ...(user?.role === 'professor' ? [{ id: 'duvidas', label: 'Dúvidas', badge: teacherDoubts.filter(d => !d.is_read).length }] : []),
            ...(user?.role === 'aluno' ? [{ id: 'respostas', label: 'Respostas', badge: studentReplies.filter(r => !seenReplyIds.has(r.id)).length }] : []),
          ].map(tab => (
            <button key={tab.id}
              className={`relative flex-1 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer border-none transition-colors
                ${activeTab === tab.id
                  ? 'bg-[#2a2a2a] text-white'
                  : 'bg-transparent text-[#8e8ea0] hover:text-white hover:bg-[#1a1a1a]'}`}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'minhas' || tab.id === 'partilhadas' || tab.id === 'arquivadas') {
                  setOpenDoubt(null)
                  setOpenReply(null)
                }
              }}>
              {tab.label}
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-0.5 [&::-webkit-scrollbar]:w-0.75 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#2a2a2a] [&::-webkit-scrollbar-thumb]:rounded-sm">

          {activeTab === 'minhas' && conversas.length > 0 && (
            <p className="m-0 px-2 pt-2 pb-1 text-[11px] font-semibold text-[#8e8ea0] uppercase tracking-wider">Recentes</p>
          )}

          {activeTab === 'minhas' && conversas.map(c => {
            const ativa = conversaId === c.id
            return (
              <div
                key={c.id}
                className={`w-full flex items-center gap-1 px-2 py-1.75 rounded-lg text-[13px] cursor-pointer transition-colors group
                  ${ativa
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-[#c5c5d2] hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                onClick={() => editingId !== c.id && abrirConversa(c)}
              >
                {editingId === c.id ? (
                  <input
                    className="flex-1 bg-[#1a1a1a] border border-[#2271b1] rounded text-white text-[13px] font-[inherit] px-1.5 py-0.5 outline-none min-w-0"
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onBlur={() => guardarTitulo(c.id)}
                    onKeyDown={e => handleEditKeyDown(e, c.id)}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{c.title}</span>
                    <div className="relative shrink-0">
                      <button
                        className={`bg-transparent border-none text-[#8e8ea0] hover:text-white px-1 py-0.5 cursor-pointer rounded hover:bg-white/10 leading-none text-[15px]
                          ${menuOpenId === c.id || ativa ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                        onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === c.id ? null : c.id) }}
                      >
                        ···
                      </button>
                      {menuOpenId === c.id && (
                        <div className="absolute right-0 top-[calc(100%+4px)] bg-[#1e1e1e] border border-[#333] rounded-xl min-w-40 z-100 shadow-[0_8px_24px_rgba(0,0,0,0.6)] overflow-hidden py-1">
                          <button className="flex items-center gap-2.5 w-full text-left bg-transparent border-none text-[#c5c5d2] text-[13px] font-[inherit] px-3.5 py-2 cursor-pointer hover:bg-[#2a2a2a] hover:text-white"
                            onClick={e => { e.stopPropagation(); iniciarEdicao(e, c); setMenuOpenId(null) }}>
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            Alterar nome
                          </button>
                          <button className="flex items-center gap-2.5 w-full text-left bg-transparent border-none text-[#c5c5d2] text-[13px] font-[inherit] px-3.5 py-2 cursor-pointer hover:bg-[#2a2a2a] hover:text-white"
                            onClick={e => { e.stopPropagation(); setMenuOpenId(null); setShareConvId(c.id); setShareEmail(''); setShareError(''); setShareSuccess('') }}>
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                            Partilhar
                          </button>
                          <button className="flex items-center gap-2.5 w-full text-left bg-transparent border-none text-[#c5c5d2] text-[13px] font-[inherit] px-3.5 py-2 cursor-pointer hover:bg-[#2a2a2a] hover:text-white"
                            onClick={e => { e.stopPropagation(); arquivarConversa(c.id) }}>
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>
                            Arquivar
                          </button>
                          <div className="h-px bg-[#333] mx-2 my-1" />
                          <button className="flex items-center gap-2.5 w-full text-left bg-transparent border-none text-[#e06c6c] text-[13px] font-[inherit] px-3.5 py-2 cursor-pointer hover:bg-[#2a1515] hover:text-[#ff9090]"
                            onClick={e => { e.stopPropagation(); setMenuOpenId(null); setConfirmDeleteId(c.id) }}>
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}

          {activeTab === 'partilhadas' && conversasPartilhadas.length > 0 && (
            <p className="m-0 px-2 pt-2 pb-1 text-[11px] font-semibold text-[#8e8ea0] uppercase tracking-wider">Partilhadas comigo</p>
          )}

          {activeTab === 'partilhadas' && conversasPartilhadas.map(c => {
            const ativa = conversaId === c.id
            return (
              <div
                key={c.id}
                className={`w-full flex flex-col px-2 py-1.75 rounded-lg text-[13px] cursor-pointer transition-colors
                  ${ativa
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-[#c5c5d2] hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                onClick={() => abrirConversa(c, true)}
              >
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{c.title}</span>
                {c.shared_by_name && (
                  <span className="text-[11px] text-[#8e8ea0] mt-0.5">por {c.shared_by_name}</span>
                )}
              </div>
            )
          })}

          {activeTab === 'arquivadas' && conversasArquivadas.length > 0 && (
            <p className="m-0 px-2 pt-2 pb-1 text-[11px] font-semibold text-[#8e8ea0] uppercase tracking-wider">Arquivadas</p>
          )}
          {activeTab === 'arquivadas' && conversasArquivadas.length === 0 && (
            <p className="m-0 px-2 pt-4 text-[12px] text-[#8e8ea0] text-center">Nenhuma conversa arquivada</p>
          )}

          {activeTab === 'arquivadas' && conversasArquivadas.map(c => (
            <div
              key={c.id}
              className="w-full flex items-center gap-1 px-2 py-1.75 rounded-lg text-[13px] text-[#c5c5d2] hover:bg-[#1a1a1a] hover:text-white transition-colors group cursor-default"
            >
              <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{c.title}</span>
              <button
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none text-[#8e8ea0] hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                onClick={() => desarquivarConversa(c.id)}
                title="Desarquivar"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" />
                  <polyline points="9 12 12 9 15 12" /><line x1="12" y1="9" x2="12" y2="16" />
                </svg>
              </button>
            </div>
          ))}

          {/* Tab Dúvidas — só para professores */}
          {activeTab === 'duvidas' && teacherDoubts.length === 0 && (
            <p className="m-0 px-2 pt-4 text-[12px] text-[#8e8ea0] text-center">Nenhuma dúvida recebida ainda</p>
          )}
          {activeTab === 'duvidas' && teacherDoubts.map(d => (
            <div key={d.id}
              className={`flex flex-col px-2 py-2 rounded-lg text-[13px] transition-colors cursor-pointer gap-0.5
                ${openDoubt?.id === d.id ? 'bg-[#2a2a2a]' : !d.is_read ? 'bg-[#1a2a1a] hover:bg-[#1f331f]' : 'hover:bg-[#1a1a1a]'}`}
              onClick={() => { setOpenDoubt(d); setOpenReply(null); if (!d.is_read) marcarDuvidaLida(d.id) }}
            >
              <div className="flex items-center gap-2">
                {!d.is_read && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                <span className="text-[#c5c5d2] font-medium truncate flex-1">{d.student_name}</span>
                <span className="text-[10px] text-[#8e8ea0] shrink-0">{timeAgo(d.created_at)}</span>
              </div>
              <p className="m-0 text-[12px] text-[#8e8ea0] truncate pl-4">{d.description}</p>
              {d.class_name && <span className="text-[10px] text-[#555] pl-4">{d.class_name}</span>}
            </div>
          ))}

          {/* Tab Respostas — só para alunos */}
          {activeTab === 'respostas' && studentReplies.length === 0 && (
            <p className="m-0 px-2 pt-4 text-[12px] text-[#8e8ea0] text-center">Nenhuma resposta recebida ainda</p>
          )}
          {activeTab === 'respostas' && studentReplies.map(r => (
            <div key={r.id}
              className={`flex flex-col px-2 py-2 rounded-lg cursor-pointer transition-colors gap-0.5
                ${openReply?.id === r.id ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]'}`}
              onClick={() => {
                setOpenReply(r); setOpenDoubt(null); setConversaId(null); setMessages([])
                setSeenReplyIds(prev => {
                  const next = new Set(prev); next.add(r.id)
                  localStorage.setItem('seenReplyIds', JSON.stringify([...next]))
                  return next
                })
              }}
            >
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-[#4ade80] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                <span className="text-[12px] font-medium text-[#c5c5d2] truncate flex-1">{r.class_name}</span>
                <span className="text-[10px] text-[#8e8ea0] shrink-0">{timeAgo(r.replied_at)}</span>
              </div>
              <p className="m-0 text-[11px] text-[#8e8ea0] truncate pl-4">{r.description}</p>
            </div>
          ))}
        </div>

        {/* Footer da sidebar */}
        <div className="px-2 py-2 border-t border-[#1f1f1f]">
          {user ? (
            <div className="flex items-center gap-2 relative cursor-pointer px-2 py-2 rounded-xl hover:bg-[#1a1a1a] transition-colors" onClick={() => setShowMenu(!showMenu)}>
              {showMenu && (
                <div className="absolute bottom-13 left-0 w-52.5 bg-[#1e1e1e] border border-[#333] rounded-2xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] z-1000">
                  <button className="w-full border-none bg-transparent text-[#c5c5d2] text-left px-3 py-2.5 rounded-xl cursor-pointer text-[13px] hover:bg-[#2a2a2a] hover:text-white"
                    onClick={() => { setShowProfile(true); setShowMenu(false) }}>
                    Perfil
                  </button>
                  <button className="w-full border-none bg-transparent text-[#c5c5d2] text-left px-3 py-2.5 rounded-xl cursor-pointer text-[13px] hover:bg-[#2a2a2a] hover:text-white">
                    Configurações
                  </button>
                  <div className="h-px bg-[#333] mx-1 my-1" />
                  <button className="w-full border-none bg-transparent text-[#ff6b6b] text-left px-3 py-2.5 rounded-xl cursor-pointer text-[13px] hover:bg-[#2a1515] hover:text-[#ff9090]"
                    onClick={handleLogout}>
                    Sair
                  </button>
                </div>
              )}
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2f80ed] text-white text-[13px] font-semibold shrink-0">
                {user.name[0].toUpperCase()}
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <p className="m-0 text-[12px] font-medium text-[#f0f0f1] whitespace-nowrap overflow-hidden text-ellipsis">{user.name}</p>
                <p className="m-0 text-[10px] text-[#8e8ea0] capitalize">{ROLE_LABEL[user.role] || user.role}</p>
              </div>
            </div>
          ) : (
            <button className="w-full bg-[#2271b1] border-none rounded text-white text-[13px] font-[inherit] font-medium py-2 cursor-pointer transition-colors hover:bg-[#135e96]"
              onClick={() => setShowLogin(true)}>
              Entrar
            </button>
          )}
        </div>
      </aside>

      {/* Área do chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#dcdcde]">

        {/* Vista de resposta do professor — só para alunos */}
        {openReply && user?.role === 'aluno' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
            <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-[#e0e0e0] shrink-0">
              <button onClick={() => setOpenReply(null)}
                className="flex items-center gap-1.5 text-[#6b7280] hover:text-[#111] text-[13px] bg-transparent border-none cursor-pointer p-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                Voltar
              </button>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-[14px] font-semibold text-[#111]">{openReply.class_name}</p>
                <p className="m-0 text-[12px] text-[#6b7280]">{timeAgo(openReply.replied_at)}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#d1d5db] [&::-webkit-scrollbar-thumb]:rounded">
              <div className="flex justify-center mb-1">
                <div className="bg-[#fef9c3] border border-[#fde68a] rounded-2xl px-4 py-3 max-w-[85%]">
                  <p className="m-0 text-[10px] font-semibold text-[#92400e] uppercase tracking-wider mb-1">A tua dúvida</p>
                  <p className="m-0 text-[13px] text-[#78350f] leading-relaxed">{openReply.description}</p>
                </div>
              </div>
              {openReply.teacher_reply && !(doubtThread.length > 0 && doubtThread[0].sender_role === 'professor' && doubtThread[0].content === openReply.teacher_reply) && (
                <div className="flex justify-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5">P</div>
                  <div className="max-w-[75%] bg-white border border-[#e5e7eb] rounded-[18px_18px_18px_3px] px-4 py-2.5 text-[13px] text-[#374151] leading-relaxed shadow-sm">
                    {openReply.teacher_reply}
                  </div>
                </div>
              )}
              {doubtThread.map(m => (
                <div key={m.id} className={`flex gap-2 ${m.sender_role === 'aluno' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender_role !== 'aluno' && (
                    <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5">P</div>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 text-[13px] leading-relaxed shadow-sm
                    ${m.sender_role === 'aluno'
                      ? 'bg-[#2271b1] text-white rounded-[18px_18px_3px_18px]'
                      : 'bg-white text-[#374151] border border-[#e5e7eb] rounded-[18px_18px_18px_3px]'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={doubtBottomRef} />
            </div>
            <div className="px-4 py-3 bg-white border-t border-[#e0e0e0] shrink-0">
              <div className="flex items-end gap-2 bg-[#f3f4f6] rounded-2xl px-3.5 py-2.5">
                <textarea
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#111827] resize-none font-[inherit] leading-normal placeholder:text-[#9ca3af]"
                  style={{ minHeight: '24px', maxHeight: '112px' }}
                  placeholder="Ainda tens dúvidas? Escreve aqui..."
                  value={threadInput}
                  onChange={e => { setThreadInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px' }}
                  rows={1}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagemThread() } }}
                />
                <button
                  onClick={enviarMensagemThread}
                  disabled={threadSending || !threadInput.trim()}
                  className="w-8 h-8 bg-[#2271b1] rounded-full flex items-center justify-center text-white border-none cursor-pointer hover:bg-[#135e96] disabled:opacity-40 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

        ) : openDoubt && user?.role === 'professor' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
            <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-[#e0e0e0] shrink-0">
              <button onClick={() => setOpenDoubt(null)}
                className="flex items-center gap-1.5 text-[#6b7280] hover:text-[#111] text-[13px] bg-transparent border-none cursor-pointer p-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                Voltar
              </button>
              <div className="w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center text-white text-[13px] font-semibold shrink-0">
                {openDoubt.student_name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-[14px] font-semibold text-[#111]">{openDoubt.student_name}</p>
                <p className="m-0 text-[12px] text-[#6b7280]">{openDoubt.class_name} · {timeAgo(openDoubt.created_at)}</p>
              </div>
              {!openDoubt.is_read && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium shrink-0">Nova</span>}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#d1d5db] [&::-webkit-scrollbar-thumb]:rounded">
              <div className="flex justify-center mb-1">
                <div className="bg-[#fef9c3] border border-[#fde68a] rounded-2xl px-4 py-3 max-w-[85%]">
                  <p className="m-0 text-[10px] font-semibold text-[#92400e] uppercase tracking-wider mb-1">Dúvida do aluno</p>
                  <p className="m-0 text-[13px] text-[#78350f] leading-relaxed">{openDoubt.description}</p>
                </div>
              </div>

              {openDoubt.messages?.length > 0 && (
                <div className="flex justify-center mb-1">
                  <div className="bg-white border border-[#e5e7eb] rounded-2xl px-4 py-3 max-w-[90%] w-full shadow-sm">
                    <button
                      onClick={() => setConvExpanded(v => !v)}
                      className="flex items-center gap-2 w-full text-left bg-transparent border-none cursor-pointer p-0 text-[12px] font-medium text-[#6b7280] hover:text-[#374151]"
                    >
                      <svg className={`w-3.5 h-3.5 transition-transform shrink-0 ${convExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                      {convExpanded ? 'Ocultar conversa com a IA' : `Ver conversa: "${openDoubt.conversation_title || 'sem título'}"`}
                    </button>
                    {convExpanded && (
                      <div className="mt-3 flex flex-col gap-2 border-t border-[#f3f4f6] pt-3">
                        {openDoubt.messages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-3 py-2 text-[12px] rounded-xl leading-relaxed
                              ${m.role === 'user'
                                ? 'bg-[#2271b1] text-white'
                                : 'bg-[#f9fafb] text-[#374151] border border-[#e5e7eb] msg-assistant-content'}`}>
                              <span className="block text-[10px] font-semibold opacity-60 mb-0.5">
                                {m.role === 'user' ? openDoubt.student_name.split(' ')[0] : 'IA'}
                              </span>
                              {m.role === 'assistant' ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm, remarkMath]}
                                  rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
                                >
                                  {normalizeMath(m.content)}
                                </ReactMarkdown>
                              ) : m.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!openDoubt.teacher_reply && doubtThread.length === 0 && (
                <p className="text-center text-[12px] text-[#9ca3af] py-6">Escreve uma resposta abaixo para iniciar a conversa</p>
              )}

              {openDoubt.teacher_reply && !(doubtThread.length > 0 && doubtThread[0].sender_role === 'professor' && doubtThread[0].content === openDoubt.teacher_reply) && (
                <div className="flex justify-end">
                  <div className="max-w-[75%] bg-[#2271b1] text-white rounded-[18px_18px_3px_18px] px-4 py-2.5 text-[13px] leading-relaxed shadow-sm">
                    {openDoubt.teacher_reply}
                  </div>
                </div>
              )}

              {doubtThread.map(m => (
                <div key={m.id} className={`flex gap-2 ${m.sender_role === 'professor' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender_role !== 'professor' && (
                    <div className="w-7 h-7 rounded-full bg-[#6366f1] flex items-center justify-center text-white text-[11px] font-semibold shrink-0 mt-0.5">
                      {m.sender_name[0].toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 text-[13px] leading-relaxed shadow-sm
                    ${m.sender_role === 'professor'
                      ? 'bg-[#2271b1] text-white rounded-[18px_18px_3px_18px]'
                      : 'bg-white text-[#374151] border border-[#e5e7eb] rounded-[18px_18px_18px_3px]'}`}>
                    {m.content}
                  </div>
                </div>
              ))}

              <div ref={doubtBottomRef} />
            </div>

            <div className="px-4 py-3 bg-white border-t border-[#e0e0e0] shrink-0">
              <div className="flex items-end gap-2 bg-[#f3f4f6] rounded-2xl px-3.5 py-2.5">
                <textarea
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#111827] resize-none font-[inherit] leading-normal placeholder:text-[#9ca3af]"
                  style={{ minHeight: '24px', maxHeight: '112px' }}
                  placeholder="Responde ao aluno..."
                  value={threadInput}
                  onChange={e => { setThreadInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px' }}
                  rows={1}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagemThread() } }}
                />
                <button
                  onClick={enviarMensagemThread}
                  disabled={threadSending || !threadInput.trim()}
                  className="w-8 h-8 bg-[#2271b1] rounded-full flex items-center justify-center text-white border-none cursor-pointer hover:bg-[#135e96] disabled:opacity-40 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header do chat com botão de dúvida */}
            {user?.role === 'aluno' && (
              <div className="flex items-center justify-end px-6 py-2 bg-white border-b border-[#e0e0e0] shrink-0">
                <button
                  onClick={abrirModalDuvida}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] text-[13px] font-medium rounded-lg cursor-pointer hover:bg-[#dbeafe] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Enviar dúvida ao professor
                </button>
              </div>
            )}

            {sharedByName && (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-[#e8f0fb] border-b border-[#c3d4f0] text-[#2271b1] text-[13px]">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Conversa partilhada por <strong className="ml-1">{sharedByName}</strong> — só de leitura
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-8 py-7 flex flex-col gap-3.5 scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#c3c4c7] [&::-webkit-scrollbar-thumb]:rounded">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2.75 text-[14px] leading-[1.6] wrap-break-word
                ${msg.role === 'user'
                      ? 'bg-[#2271b1] text-white rounded-[14px_14px_3px_14px] whitespace-pre-wrap'
                      : 'bg-white text-[#1d2327] border border-[#c3c4c7] rounded-[14px_14px_14px_3px] shadow-[0_1px_1px_rgba(0,0,0,0.04)] msg-assistant-content'
                    }`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
                      >
                        {normalizeMath(msg.content)}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#c3c4c7] rounded-[14px_14px_14px_3px] shadow-[0_1px_1px_rgba(0,0,0,0.04)] flex items-center gap-1.25 px-4.5 py-3.5">
                    <span className="typing-dot" />
                    <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                    <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {<div className="px-8 py-2 bg-white shrink-0">
              <div className="relative border border-[#c3c4c7] rounded-xl bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus-within:border-[#2271b1] transition-colors">

                {/* Popover do modelo — abre para cima */}
                {showModelMenu && !sharedByName && (
                  <div
                    className="absolute bottom-full right-0 mb-2 bg-white border border-[#e0e0e0] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] overflow-hidden w-72 z-50"
                    onClick={e => e.stopPropagation()}
                  >
                    {MODELS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m.id); setShowModelMenu(false) }}
                        className={`flex items-start justify-between w-full px-4 py-3.5 text-left border-none cursor-pointer transition-colors gap-3
                      ${selectedModel === m.id ? 'bg-[#f6f7f7]' : 'bg-white hover:bg-[#f6f7f7]'}`}
                      >
                        <div>
                          <p className="m-0 text-[14px] font-semibold text-[#1d2327]">{m.name}</p>
                          <p className="m-0 text-[12px] text-[#50575e] mt-0.5">{m.desc}</p>
                        </div>
                        {selectedModel === m.id && (
                          <svg className="w-4 h-4 text-[#1d2327] shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  className="w-full bg-transparent text-[#1d2327] border-none outline-none px-4 py-2.5 pr-44 text-[14px] font-[inherit] resize-none leading-normal min-h-8 max-h-32 placeholder:text-[#8c8f94] disabled:opacity-50 disabled:cursor-not-allowed"
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={sharedByName ? 'Esta conversa é só de leitura' : user ? 'Pergunte qualquer coisa...' : 'Faz login para enviar mensagens...'}
                  rows={1}
                  disabled={loading || !!sharedByName}
                />

                {/* Botões flutuantes à direita */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  {!sharedByName && (
                    <button
                      onClick={e => { e.stopPropagation(); setShowModelMenu(v => !v) }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium text-[#50575e] bg-[#f0f0f1] hover:bg-[#dcdcde] transition-colors cursor-pointer border-none whitespace-nowrap"
                    >
                      {MODELS.find(m => m.id === selectedModel)?.name}
                      <svg className={`w-3 h-3 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  )}
                  <select
                    value={selectedClassroom ?? ""}
                    onChange={(e) => setSelectedClassroom(Number(e.target.value))}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    {studentClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="w-8 h-8 bg-[#2271b1] border-none rounded-lg text-white cursor-pointer flex items-center justify-center transition-colors hover:bg-[#135e96] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    onClick={sendMessage}
                    disabled={loading || !input.trim() || !!sharedByName}
                    aria-label="Enviar"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>}
          </>
        )}
      </div>

      {/* Modal de login */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100"
          onClick={e => e.target === e.currentTarget && setShowLogin(false)}>
          <div className="bg-white border border-[#c3c4c7] rounded w-full max-w-90 shadow-[0_5px_15px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#c3c4c7]">
              <div className="text-lg font-bold text-[#f0a500] tracking-tight">GEIA</div>
              <button className="w-7 h-7 bg-transparent border-none text-[#8c8f94] cursor-pointer flex items-center justify-center rounded transition-colors hover:bg-[#f0f0f1] hover:text-[#1d2327]"
                onClick={() => setShowLogin(false)}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="m-0 px-5 pt-3.5 text-[13px] text-[#50575e]">Entra para começares a conversar</p>
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5 px-5 pb-5 pt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#1d2327]">Email</label>
                <input className={inputCls} type="email" value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="o.teu@email.pt" required disabled={loginLoading} autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#1d2327]">Password</label>
                <input className={inputCls} type="password" value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••" required disabled={loginLoading} />
              </div>
              {loginError && <p className="m-0 text-[13px] text-[#d63638]">{loginError}</p>}
              <button type="submit" disabled={loginLoading}
                className="w-full bg-[#2271b1] border-none rounded text-white text-[13px] font-medium font-[inherit] py-2.5 cursor-pointer transition-colors hover:bg-[#135e96] disabled:opacity-50 disabled:cursor-not-allowed mt-0.5">
                {loginLoading ? 'A entrar...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de perfil */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100"
          onClick={e => e.target === e.currentTarget && setShowProfile(false)}>
          <div className="w-125 max-w-[90vw] bg-[#1e2732] border border-[#2d3a4a] rounded-[20px] p-6 text-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="m-0 text-lg font-semibold">Perfil</h2>
              <button className="border-none bg-transparent text-white cursor-pointer text-xl leading-none"
                onClick={() => setShowProfile(false)}>✕</button>
            </div>
            <div className="min-h-50 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#2f80ed] text-white font-semibold shrink-0">
                  {user.name[0].toUpperCase()}
                </div>
                <div className="flex flex-col gap-0.5 text-sm">
                  <span className="text-[#a7aaad]">Nome: <span className="text-white font-medium">{user.name}</span></span>
                  <span className="text-[#a7aaad]">E-mail: <span className="text-white">{user.email}</span></span>
                  <span className="text-[#a7aaad]">Role: <span className="text-white">{ROLE_LABEL[user.role] || user.role}</span></span>
                </div>
              </div>

              <div className="border-t border-[#2d3a4a]" />

              <h3 className="m-0 text-base font-semibold">Alterar password</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-[#a7aaad]">Password atual</label>
                <input className={inputCls} type="password" value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-[#a7aaad]">Nova password</label>
                <input className={inputCls} type="password" value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-[#a7aaad]">Confirmar password</label>
                <input className={inputCls} type="password" value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </div>

              {profileError && <p className="m-0 text-[13px] text-[#e06c6c]">{profileError}</p>}
              {profileSuccess && <p className="m-0 text-[13px] text-[#6fcf97]">{profileSuccess}</p>}

              <button disabled={savingProfile}
                className="w-full bg-[#2271b1] border-none rounded text-white text-[13px] font-medium font-[inherit] py-2.5 cursor-pointer transition-colors hover:bg-[#135e96] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleChangePassword}>
                {savingProfile ? 'A guardar...' : 'Guardar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de partilha */}
      {shareConvId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100"
          onClick={e => e.target === e.currentTarget && setShareConvId(null)}>
          <div className="bg-white border border-[#c3c4c7] rounded w-full max-w-95 shadow-[0_5px_15px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#c3c4c7]">
              <span className="text-[15px] font-semibold text-[#1d2327]">Partilhar conversa</span>
              <button className="w-7 h-7 bg-transparent border-none text-[#8c8f94] cursor-pointer flex items-center justify-center rounded hover:bg-[#f0f0f1] hover:text-[#1d2327] transition-colors"
                onClick={() => setShareConvId(null)}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleShare} className="flex flex-col gap-3.5 px-5 py-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#1d2327]">Email do utilizador</label>
                <input
                  className={inputCls}
                  type="email"
                  value={shareEmail}
                  onChange={e => setShareEmail(e.target.value)}
                  placeholder="email@exemplo.pt"
                  required
                  autoFocus
                  disabled={shareLoading}
                />
              </div>
              {shareError && <p className="m-0 text-[13px] text-[#d63638]">{shareError}</p>}
              {shareSuccess && <p className="m-0 text-[13px] text-green-600">{shareSuccess}</p>}
              <button type="submit" disabled={shareLoading}
                className="w-full bg-[#2271b1] border-none rounded text-white text-[13px] font-medium font-[inherit] py-2.5 cursor-pointer transition-colors hover:bg-[#135e96] disabled:opacity-50 disabled:cursor-not-allowed">
                {shareLoading ? 'A partilhar...' : 'Partilhar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de eliminação */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100"
          onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-[#1d2327] border border-[#3c4348] rounded-xl px-8 py-7 max-w-90 w-[90%] text-center"
            onClick={e => e.stopPropagation()}>
            <p className="text-[#e0e0e0] text-[15px] m-0 mb-6">Tem a certeza que deseja eliminar esta conversa?</p>
            <div className="flex gap-2.5 justify-center">
              <button className="px-5 py-2 rounded-md border border-[#3c4348] bg-transparent text-[#a7aaad] text-[14px] cursor-pointer hover:bg-[#2c3338] hover:text-white transition-colors"
                onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
              <button className="px-5 py-2 rounded-md border-none bg-[#c0392b] text-white text-[14px] cursor-pointer hover:bg-[#e74c3c] transition-colors"
                onClick={() => eliminarConversa(confirmDeleteId)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de dúvida ao professor */}
      {showDoubtModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-2000" onClick={() => setShowDoubtModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-110 max-w-[90vw] shadow-[0_20px_60px_rgba(0,0,0,0.3)]" onClick={e => e.stopPropagation()}>
            <h2 className="m-0 mb-1 text-[16px] font-semibold text-[#111827]">Enviar dúvida ao professor</h2>
            <p className="m-0 mb-4 text-[13px] text-[#6b7280]">O professor receberá esta conversa e a tua descrição.</p>
            <form onSubmit={submeterDuvida} className="flex flex-col gap-3">
              {/* Conversa anexada */}
              {conversaId ? (
                <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 text-[#16a34a] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-[13px] text-[#166534]">
                    Conversa <strong>"{conversas.find(c => c.id === conversaId)?.title || 'atual'}"</strong> será incluída
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-[#fefce8] border border-[#fde68a] rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 text-[#ca8a04] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="text-[13px] text-[#92400e]">Abre uma conversa antes de enviar a dúvida</span>
                </div>
              )}
              {doubtClasses.length > 1 && (
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">Turma</label>
                  <select
                    value={doubtClassId}
                    onChange={e => setDoubtClassId(e.target.value)}
                    className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-[13px] text-[#111827] outline-none focus:border-[#2563eb] bg-white"
                  >
                    <option value="">Seleciona uma turma...</option>
                    {doubtClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {doubtClasses.length === 1 && (
                <p className="text-[13px] text-[#374151] bg-[#f9fafb] rounded-lg px-3 py-2 m-0">
                  Turma: <strong>{doubtClasses[0].name}</strong>
                </p>
              )}
              {doubtClasses.length === 0 && (
                <p className="text-[13px] text-[#ef4444] m-0">Não pertences a nenhuma turma.</p>
              )}
              <div>
                <label className="block text-[12px] font-medium text-[#374151] mb-1">O que não percebeste?</label>
                <textarea
                  value={doubtMessage}
                  onChange={e => setDoubtMessage(e.target.value)}
                  rows={3}
                  placeholder="Ex: Não percebi como se calcula a primitiva de funções compostas..."
                  className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-[13px] text-[#111827] outline-none focus:border-[#2563eb] resize-none font-[inherit]"
                />
              </div>
              {doubtError && <p className="m-0 text-[13px] text-[#ef4444]">{doubtError}</p>}
              {doubtSuccess && <p className="m-0 text-[13px] text-[#16a34a] font-medium">{doubtSuccess}</p>}
              <div className="flex gap-2 justify-end mt-1">
                <button type="button" onClick={() => setShowDoubtModal(false)}
                  className="px-4 py-2 rounded-lg text-[13px] text-[#6b7280] bg-[#f3f4f6] border-none cursor-pointer hover:bg-[#e5e7eb]">
                  Cancelar
                </button>
                <button type="submit" disabled={doubtLoading || doubtClasses.length === 0}
                  className="px-4 py-2 rounded-lg text-[13px] text-white bg-[#2563eb] border-none cursor-pointer hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed">
                  {doubtLoading ? 'A enviar...' : 'Enviar dúvida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
