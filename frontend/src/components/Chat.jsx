import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import './Chat.css'

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
  const [conversaId, setConversaId] = useState(null)
  const [conversas, setConversas] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [activeTab, setActiveTab] = useState('minhas')
  const [conversasPartilhadas, setConversasPartilhadas] = useState([])
  const [sharedByName, setSharedByName] = useState(null)
  const [shareConvId, setShareConvId] = useState(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareError, setShareError] = useState('')
  const [shareSuccess, setShareSuccess] = useState('')
  const [shareLoading, setShareLoading] = useState(false)

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

  useEffect(() => {
    if (menuOpenId === null) return
    function fechar() { setMenuOpenId(null) }
    document.addEventListener('click', fechar)
    return () => document.removeEventListener('click', fechar)
  }, [menuOpenId])

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

  useEffect(() => {
    carregarConversas(user)
    carregarPartilhadas(user)
  }, [user, carregarConversas, carregarPartilhadas])

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
    setConversaId(conv.id)
    setSharedByName(partilhada ? (conv.shared_by_name || null) : null)
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages/`)
      setMessages(await res.json())
    } catch { setMessages([]) }
  }

  function novaConversa() { setConversaId(null); setMessages([]); setSharedByName(null) }

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
      setConversas(prev => prev.filter(c => c.id !== id))
      if (conversaId === id) { setConversaId(null); setMessages([]) }
    } catch { }
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
        body: JSON.stringify({ message: text, user_id: user.id, conversation_id: conversaId }),
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
      <aside className="w-60 shrink-0 bg-[#1d2327] flex flex-col">
        <div className="text-xl font-bold text-[#f0a500] px-5 py-[18px] tracking-tight border-b border-[#2c3338]">
          GEIA
        </div>

        {user && (
          <button
            className="flex items-center gap-2 mx-2.5 mt-2.5 mb-1.5 px-3.5 py-2 bg-transparent border border-[#2c3338] rounded text-[#a7aaad] text-[13px] font-[inherit] cursor-pointer w-[calc(100%-20px)] hover:bg-[#2c3338] hover:text-white transition-colors"
            onClick={novaConversa}
          >
            <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova conversa
          </button>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#2c3338] shrink-0">
          {['minhas', 'partilhadas'].map(tab => (
            <button key={tab}
              className={`flex-1 py-2 text-[12px] font-medium cursor-pointer border-none transition-colors
                ${activeTab === tab
                  ? 'bg-transparent text-white border-b-2 border-b-[#2271b1]'
                  : 'bg-transparent text-[#a7aaad] hover:text-white'}`}
              onClick={() => setActiveTab(tab)}>
              {tab === 'minhas' ? 'Minhas' : 'Partilhadas'}
            </button>
          ))}
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto py-1.5 flex flex-col [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#2c3338] [&::-webkit-scrollbar-thumb]:rounded-sm">
          {activeTab === 'minhas' && conversas.map(c => {
            const ativa = conversaId === c.id
            return (
              <div
                key={c.id}
                className={`w-full flex items-center gap-1 pl-4 pr-2 py-2 text-[13px] border-l-[3px] cursor-pointer transition-colors group
                  ${ativa
                    ? 'bg-[#2c3338] text-white border-l-[#2271b1]'
                    : 'bg-transparent text-[#a7aaad] border-l-transparent hover:bg-[#2c3338] hover:text-white'
                  }`}
                onClick={() => editingId !== c.id && abrirConversa(c)}
              >
                {editingId === c.id ? (
                  <input
                    className="flex-1 bg-[#1a1d20] border border-[#2271b1] rounded text-white text-[13px] font-[inherit] px-1.5 py-0.5 outline-none min-w-0"
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onBlur={() => guardarTitulo(c.id)}
                    onKeyDown={e => handleEditKeyDown(e, c.id)}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis" title={c.title}>{c.title}</span>
                    <div className="relative shrink-0">
                      <button
                        className={`bg-transparent border-none text-inherit px-1 py-0.5 cursor-pointer text-base font-bold rounded hover:bg-white/10 leading-none
                          ${menuOpenId === c.id || ativa ? 'block' : 'hidden group-hover:block'}`}
                        onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === c.id ? null : c.id) }}
                        title="Opções"
                      >
                        ···
                      </button>
                      {menuOpenId === c.id && (
                        <div className="absolute right-0 top-[calc(100%+4px)] bg-[#2c3338] border border-[#3c4348] rounded-md min-w-[150px] z-[100] shadow-[0_4px_12px_rgba(0,0,0,0.4)] overflow-hidden">
                          <button className="block w-full text-left bg-transparent border-none text-[#e0e0e0] text-[13px] font-[inherit] px-3.5 py-[9px] cursor-pointer hover:bg-[#3c4348] hover:text-white"
                            onClick={e => { e.stopPropagation(); iniciarEdicao(e, c); setMenuOpenId(null) }}>
                            Alterar nome
                          </button>
                          <button className="block w-full text-left bg-transparent border-none text-[#e0e0e0] text-[13px] font-[inherit] px-3.5 py-[9px] cursor-pointer hover:bg-[#3c4348] hover:text-white"
                            onClick={e => { e.stopPropagation(); setMenuOpenId(null); setShareConvId(c.id); setShareEmail(''); setShareError(''); setShareSuccess('') }}>
                            Partilhar conversa
                          </button>
                          <button className="block w-full text-left bg-transparent border-none text-[#e0e0e0] text-[13px] font-[inherit] px-3.5 py-[9px] cursor-pointer hover:bg-[#3c4348] hover:text-white"
                            onClick={e => { e.stopPropagation(); arquivarConversa(c.id) }}>
                            Arquivar conversa
                          </button>
                          <button className="block w-full text-left bg-transparent border-none text-[#e06c6c] text-[13px] font-[inherit] px-3.5 py-[9px] cursor-pointer hover:bg-[#5a2020] hover:text-[#ff9090]"
                            onClick={e => { e.stopPropagation(); setMenuOpenId(null); setConfirmDeleteId(c.id) }}>
                            Eliminar conversa
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}

          {activeTab === 'partilhadas' && conversasPartilhadas.map(c => {
            const ativa = conversaId === c.id
            return (
              <div
                key={c.id}
                className={`w-full flex flex-col pl-4 pr-2 py-2 text-[13px] border-l-[3px] cursor-pointer transition-colors
                  ${ativa
                    ? 'bg-[#2c3338] text-white border-l-[#2271b1]'
                    : 'bg-transparent text-[#a7aaad] border-l-transparent hover:bg-[#2c3338] hover:text-white'
                  }`}
                onClick={() => abrirConversa(c, true)}
              >
                <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={c.title}>{c.title}</span>
                {c.shared_by_name && (
                  <span className="text-[11px] text-[#6b7280] mt-0.5">partilhada por {c.shared_by_name}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer da sidebar */}
        <div className="px-4 py-3.5 border-t border-[#2c3338]">
          {user ? (
            <div className="flex items-center gap-3 relative cursor-pointer p-3" onClick={() => setShowMenu(!showMenu)}>
              {showMenu && (
                <div className="absolute bottom-[70px] left-0 w-[260px] bg-[#1d2327] border border-[#444] rounded-[18px] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.4)] z-[1000]">
                  <button className="w-full border-none bg-transparent text-white text-left px-3.5 py-3.5 rounded-xl cursor-pointer text-[15px] hover:bg-[#404040]"
                    onClick={() => { setShowProfile(true); setShowMenu(false) }}>
                    Perfil
                  </button>
                  <button className="w-full border-none bg-transparent text-white text-left px-3.5 py-3.5 rounded-xl cursor-pointer text-[15px] hover:bg-[#404040]">
                    Configurações
                  </button>
                  <button className="w-full border-none bg-transparent text-[#ff6b6b] text-left px-3.5 py-3.5 rounded-xl cursor-pointer text-[15px] hover:bg-[#404040]"
                    onClick={handleLogout}>
                    Sair
                  </button>
                </div>
              )}
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#2f80ed] text-white font-semibold shrink-0">
                {user.name[0].toUpperCase()}
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <p className="m-0 text-[13px] font-medium text-[#f0f0f1] whitespace-nowrap overflow-hidden text-ellipsis">{user.name}</p>
                <p className="m-0 text-[11px] text-[#a7aaad] capitalize">{ROLE_LABEL[user.role] || user.role}</p>
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
        {sharedByName && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-[#e8f0fb] border-b border-[#c3d4f0] text-[#2271b1] text-[13px]">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Conversa partilhada por <strong className="ml-1">{sharedByName}</strong> — só de leitura
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-8 py-7 flex flex-col gap-3.5 scroll-smooth [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#c3c4c7] [&::-webkit-scrollbar-thumb]:rounded">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-[11px] text-[14px] leading-[1.6] break-words
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
              <div className="bg-white border border-[#c3c4c7] rounded-[14px_14px_14px_3px] shadow-[0_1px_1px_rgba(0,0,0,0.04)] flex items-center gap-[5px] px-[18px] py-3.5">
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="flex items-end gap-2.5 px-8 py-3.5 border-t border-[#c3c4c7] bg-white shrink-0">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-white text-[#1d2327] border border-[#c3c4c7] rounded px-3.5 py-2.5 text-[14px] font-[inherit] resize-none outline-none leading-[1.5] min-h-[42px] max-h-[160px] transition-colors focus:border-[#2271b1] placeholder:text-[#8c8f94] disabled:opacity-50 disabled:cursor-not-allowed shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={sharedByName ? 'Esta conversa é só de leitura' : user ? 'Pergunte qualquer coisa...' : 'Faz login para enviar mensagens...'}
            rows={1}
            disabled={loading || !!sharedByName}
          />
          <button
            className="w-[42px] h-[42px] shrink-0 bg-[#2271b1] border-none rounded text-white cursor-pointer flex items-center justify-center transition-colors hover:bg-[#135e96] disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={sendMessage}
            disabled={loading || !input.trim() || !!sharedByName}
            aria-label="Enviar"
          >
            <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal de login */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
          onClick={e => e.target === e.currentTarget && setShowLogin(false)}>
          <div className="bg-white border border-[#c3c4c7] rounded w-full max-w-[360px] shadow-[0_5px_15px_rgba(0,0,0,0.15)]">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
          onClick={e => e.target === e.currentTarget && setShowProfile(false)}>
          <div className="w-[500px] max-w-[90vw] bg-[#1e2732] border border-[#2d3a4a] rounded-[20px] p-6 text-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="m-0 text-lg font-semibold">Perfil</h2>
              <button className="border-none bg-transparent text-white cursor-pointer text-xl leading-none"
                onClick={() => setShowProfile(false)}>✕</button>
            </div>
            <div className="min-h-[200px] flex flex-col gap-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
          onClick={e => e.target === e.currentTarget && setShareConvId(null)}>
          <div className="bg-white border border-[#c3c4c7] rounded w-full max-w-95 shadow-[0_5px_15px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#c3c4c7]">
              <span className="text-[15px] font-semibold text-[#1d2327]">Partilhar conversa</span>
              <button className="w-7 h-7 bg-transparent border-none text-[#8c8f94] cursor-pointer flex items-center justify-center rounded hover:bg-[#f0f0f1] hover:text-[#1d2327] transition-colors"
                onClick={() => setShareConvId(null)}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
          onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-[#1d2327] border border-[#3c4348] rounded-xl px-8 py-7 max-w-[360px] w-[90%] text-center"
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

    </div>
  )
}
