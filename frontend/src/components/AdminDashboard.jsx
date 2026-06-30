import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.css'
import UserEditModal from './UserEditModal'
import ClassesSection from './ClassesSection'
import AlarmingMessagesSection from './AlarmingMessagesSection'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'aluno', custom_prompt: '' }

const NAV = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Gestão de Utilizadores',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'classes',
    label: 'Turmas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    id: 'alarming',
    label: 'Mensagens Alarmantes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
]

function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className="user-avatar" style={{ background: color }}>
      {initials}
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const adminName = localStorage.getItem('adminName') || 'Admin'
  const [active, setActive] = useState('overview')
  const [userTab, setUserTab] = useState('list')

  const [users, setUsers] = useState([])
  const [classes, setClasses] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos')
  const [activeFilter, setActiveFilter] = useState('todos')
  const [classFilter, setClassFilter] = useState('todos')

  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [unreadAlarms, setUnreadAlarms] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) { navigate('/admin'); return }
    fetchUsers()
    fetchClasses()
    fetchUnreadAlarms()
    const interval = setInterval(() => { fetchUsers(); fetchUnreadAlarms() }, 30000)
    return () => clearInterval(interval)
  }, [navigate])

  async function fetchUnreadAlarms() {
    try {
      const res = await fetch('/api/alarming-messages/')
      const data = await res.json()
      setUnreadAlarms(data.filter(m => !m.is_read).length)
    } catch { /* silent */ }
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users/')
      setUsers(await res.json())
    } catch { setUsers([]) }
  }

  async function fetchClasses() {
    try {
      const res = await fetch('/api/classes/')
      setClasses(await res.json())
    } catch { setClasses([]) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setFormError(''); setFormSuccess(''); setSubmitting(true)
    try {
      const res = await fetch('/api/users/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setFormSuccess(`Utilizador "${form.name}" criado com sucesso.`)
        setForm(EMPTY_FORM)
        fetchUsers()
      } else {
        setFormError(Object.values(data).flat().join(' ') || 'Erro ao criar utilizador.')
      }
    } catch { setFormError('Erro ao conectar ao servidor.') }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Eliminar "${name}"?`)) return
    await fetch(`/api/users/${id}/delete/`, { method: 'DELETE' })
    fetchUsers()
  }

  function handleLogout() {
    localStorage.removeItem('adminLoggedIn')
    localStorage.removeItem('adminName')
    navigate('/admin')
  }

  const filtered = users.filter(u => {
    if (roleFilter !== 'todos' && u.role !== roleFilter) return false
    if (activeFilter === 'ativo' && !u.is_active) return false
    if (activeFilter === 'inativo' && u.is_active) return false
    if (classFilter === 'sem_turma' && u.classes?.length > 0) return false
    if (classFilter !== 'todos' && classFilter !== 'sem_turma') {
      if (!u.classes?.some(c => c.id === Number(classFilter))) return false
    }
    const q = search.toLowerCase()
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  return (
    <div className="dashboard-layout">

      <aside className="sidebar">
        <div className="sidebar-logo">GEIA</div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item ${active === item.id ? 'nav-item-active' : ''}`}
              onClick={() => { setActive(item.id); if (item.id === 'alarming') setUnreadAlarms(0) }}
            >
              <span className="nav-icon" style={item.id === 'alarming' ? { color: unreadAlarms > 0 ? '#dc2626' : undefined } : {}}>
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
              {item.id === 'alarming' && unreadAlarms > 0 && (
                <span className="nav-alarm-badge">{unreadAlarms}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{adminName[0].toUpperCase()}</div>
            <div>
              <p className="sidebar-name">{adminName}</p>
              <p className="sidebar-role">Administrador</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      <main className="dashboard-content">

        {/* ── Overview ── */}
        {active === 'overview' && (
          <section className="content-section">
            <div className="welcome-banner">
              <h1>Bem-vindo ao GEIA</h1>
              <p>Plataforma de gestão educacional com inteligência artificial.</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{users.filter(u => u.role === 'aluno').length}</span>
                <span className="stat-label">Alunos</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{users.filter(u => u.role === 'professor').length}</span>
                <span className="stat-label">Professores</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{users.filter(u => u.role === 'admin').length}</span>
                <span className="stat-label">Admins</span>
              </div>
              <div className="stat-card">
                <span className="stat-value stat-inactive">{users.filter(u => !u.is_active).length}</span>
                <span className="stat-label">Inativos</span>
              </div>
            </div>
          </section>
        )}

        {/* ── Users ── */}
        {active === 'users' && (
          <section className="content-section">
            <div className="section-header">
              <h1>Gestão de Utilizadores</h1>
              <div className="user-tabs">
                {[['list','Lista'],['create','Criar']].map(([id, label]) => (
                  <button
                    key={id}
                    className={`user-tab ${userTab === id ? 'user-tab-active' : ''}`}
                    onClick={() => setUserTab(id)}
                  >
                    {label}
                    {id === 'list' && <span className="tab-count">{users.length}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista */}
            {userTab === 'list' && (
              <div className="card">
                {/* Toolbar */}
                <div className="list-toolbar">
                  <div className="search-box">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Pesquisar nome ou email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="search-input"
                    />
                    {search && (
                      <button className="search-clear" onClick={() => setSearch('')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {(roleFilter !== 'todos' || activeFilter !== 'todos' || classFilter !== 'todos') && (
                    <button className="clear-filters-btn" onClick={() => { setRoleFilter('todos'); setActiveFilter('todos'); setClassFilter('todos') }}>
                      Limpar filtros
                    </button>
                  )}
                </div>

                <div className="filter-bar">
                  <div className="filter-section">
                    <span className="filter-label">Função</span>
                    <div className="filter-pills">
                      {[['todos','Todos'],['aluno','Aluno'],['professor','Professor'],['admin','Admin']].map(([v, l]) => (
                        <button key={v} className={`pill ${roleFilter === v ? 'pill-active' : ''}`} onClick={() => setRoleFilter(v)}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div className="filter-section">
                    <span className="filter-label">Estado</span>
                    <div className="filter-pills">
                      {[['todos','Todos'],['ativo','Ativos'],['inativo','Inativos']].map(([v, l]) => (
                        <button key={v} className={`pill ${activeFilter === v ? 'pill-active' : ''}`} onClick={() => setActiveFilter(v)}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div className="filter-section">
                    <span className="filter-label">Turma</span>
                    <select
                      className="filter-select"
                      value={classFilter}
                      onChange={e => setClassFilter(e.target.value)}
                    >
                      <option value="todos">Todas as turmas</option>
                      <option value="sem_turma">Sem turma</option>
                      {classes.map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Resultados */}
                {users.length === 0 && <p className="empty-msg">Nenhum utilizador criado ainda.</p>}
                {users.length > 0 && filtered.length === 0 && <p className="empty-msg">Nenhum resultado encontrado.</p>}

                {filtered.length > 0 && (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Utilizador</th>
                        <th>Função</th>
                        <th>Estado</th>
                        <th>Turma(s)</th>
                        <th>Prompt IA</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="user-cell">
                              <Avatar name={u.name} />
                              <div>
                                <p className="user-name">{u.name}</p>
                                <p className="user-email">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                          <td><span className={`active-badge ${u.is_active ? 'active-true' : 'active-false'}`}>{u.is_active ? 'Ativo' : 'Inativo'}</span></td>
                          <td>
                            {u.classes && u.classes.length > 0
                              ? <div className="class-tags">{u.classes.map(c => <span key={c.id} className="class-tag">{c.name}</span>)}</div>
                              : <span className="empty-prompt">—</span>}
                          </td>
                          <td className="prompt-cell">{u.custom_prompt || <span className="empty-prompt">—</span>}</td>
                          <td className="action-cell">
                            <button className="icon-btn edit-btn" title="Editar" onClick={() => setEditingUser(u)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button className="icon-btn delete-btn" title="Eliminar" onClick={() => handleDelete(u.id, u.name)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {filtered.length > 0 && (
                  <p className="list-footer">{filtered.length} de {users.length} utilizador(es)</p>
                )}
              </div>
            )}

            {/* Criar */}
            {userTab === 'create' && (
              <div className="card">
                <h2>Novo Utilizador</h2>
                <form onSubmit={handleCreate} className="user-form">
                  <div className="form-row">
                    <div className="form-field">
                      <label>Nome</label>
                      <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" required disabled={submitting} />
                    </div>
                    <div className="form-field">
                      <label>Email</label>
                      <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.pt" required disabled={submitting} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Password</label>
                      <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••" required disabled={submitting} />
                    </div>
                    <div className="form-field">
                      <label>Função</label>
                      <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} disabled={submitting}>
                        <option value="aluno">Aluno</option>
                        <option value="professor">Professor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Prompt personalizado <span className="label-hint">(instruções para a IA)</span></label>
                    <textarea value={form.custom_prompt} onChange={e => setForm(f => ({ ...f, custom_prompt: e.target.value }))} placeholder="Ex: Responde sempre em português e de forma simples..." rows={3} disabled={submitting} />
                  </div>
                  {formError && <p className="form-error">{formError}</p>}
                  {formSuccess && <p className="form-success">{formSuccess}</p>}
                  <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setFormSuccess('') }} disabled={submitting}>Limpar</button>
                    <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'A criar...' : 'Criar Utilizador'}</button>
                  </div>
                </form>
              </div>
            )}

          </section>
        )}

        {active === 'classes' && <ClassesSection users={users} />}

        {active === 'alarming' && <AlarmingMessagesSection />}

      </main>

      <UserEditModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={fetchUsers} />
    </div>
  )
}
