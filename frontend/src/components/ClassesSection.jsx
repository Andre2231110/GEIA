import { useEffect, useState } from 'react'
import './ClassesSection.css'

const EMPTY_FORM = { name: '', course: '', year: new Date().getFullYear(), teacher: '' }

function Avatar({ name, size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className="cs-avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

export default function ClassesSection({ users }) {
  const professors = users.filter(u => u.role === 'professor' && u.is_active)
  const alunos = users.filter(u => u.role === 'aluno' && u.is_active)

  const [classTab, setClassTab] = useState('list')
  const [classes, setClasses] = useState([])
  const [detail, setDetail] = useState(null)       // class being viewed
  const [classStudents, setClassStudents] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [addError, setAddError] = useState('')
  const [addSearch, setAddSearch] = useState('')

  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [editingClass, setEditingClass] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => { fetchClasses() }, [])

  async function fetchClasses() {
    try {
      const res = await fetch('/api/classes/')
      setClasses(await res.json())
    } catch { setClasses([]) }
  }

  async function fetchClassStudents(id) {
    try {
      const res = await fetch(`/api/classes/${id}/students/`)
      setClassStudents(await res.json())
    } catch { setClassStudents([]) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setFormError(''); setFormSuccess(''); setSubmitting(true)
    try {
      const res = await fetch('/api/classes/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, year: Number(form.year), teacher: form.teacher || null }),
      })
      const data = await res.json()
      if (res.ok) {
        setFormSuccess(`Turma "${form.name}" criada com sucesso.`)
        setForm(EMPTY_FORM)
        fetchClasses()
      } else {
        setFormError(Object.values(data).flat().join(' ') || 'Erro ao criar turma.')
      }
    } catch { setFormError('Erro ao conectar ao servidor.') }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Eliminar a turma "${name}"? Os alunos não serão eliminados.`)) return
    await fetch(`/api/classes/${id}/delete/`, { method: 'DELETE' })
    fetchClasses()
    if (detail?.id === id) setDetail(null)
  }

  function openDetail(cls) {
    setDetail(cls)
    setSelectedIds(new Set())
    setAddError('')
    setAddSearch('')
    fetchClassStudents(cls.id)
  }

  function toggleStudent(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll(list) {
    const allSelected = list.every(a => selectedIds.has(a.id))
    setSelectedIds(allSelected ? new Set() : new Set(list.map(a => a.id)))
  }

  async function handleAddStudents() {
    if (selectedIds.size === 0) return
    setAddError('')
    const results = await Promise.all(
      [...selectedIds].map(id =>
        fetch(`/api/classes/${detail.id}/students/add/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: id }),
        }).then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      )
    )
    const errors = results.filter(r => !r.ok).map(r => r.data.error)
    if (errors.length) setAddError(errors.join(' · '))
    setSelectedIds(new Set())
    fetchClassStudents(detail.id)
    fetchClasses()
  }

  async function handleRemoveStudent(studentId) {
    await fetch(`/api/classes/${detail.id}/students/${studentId}/remove/`, { method: 'DELETE' })
    fetchClassStudents(detail.id)
    fetchClasses()
  }

  function openEdit(cls) {
    setEditingClass(cls)
    setEditForm({ name: cls.name, course: cls.course, year: cls.year, teacher: cls.teacher ?? '' })
    setEditError('')
  }

  async function handleEdit(e) {
    e.preventDefault()
    setEditError(''); setEditSaving(true)
    try {
      const res = await fetch(`/api/classes/${editingClass.id}/edit/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, year: Number(editForm.year), teacher: editForm.teacher || null }),
      })
      const data = await res.json()
      if (res.ok) {
        setEditingClass(null)
        fetchClasses()
        if (detail?.id === data.id) setDetail(data)
      } else {
        setEditError(Object.values(data).flat().join(' ') || 'Erro ao guardar.')
      }
    } catch { setEditError('Erro ao conectar ao servidor.') }
    finally { setEditSaving(false) }
  }

  const studentsInClass = new Set(classStudents.map(s => s.id))
  const availableToAdd = alunos.filter(a => !studentsInClass.has(a.id))
  const filteredAvailable = availableToAdd.filter(a =>
    !addSearch || a.name.toLowerCase().includes(addSearch.toLowerCase()) || a.email.toLowerCase().includes(addSearch.toLowerCase())
  )

  // ── Detail view ──
  if (detail) {
    const prof = users.find(u => u.id === detail.teacher)
    return (
      <div className="cs-detail">
        <div className="cs-detail-header">
          <button className="cs-back-btn" onClick={() => setDetail(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Voltar
          </button>
          <div className="cs-detail-title">
            <h1>{detail.name}</h1>
            <span className="cs-detail-meta">{detail.course} · {detail.year}</span>
          </div>
          <div className="cs-detail-actions">
            <button className="icon-btn edit-btn" title="Editar" onClick={() => openEdit(detail)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className="icon-btn delete-btn" title="Eliminar" onClick={() => handleDelete(detail.id, detail.name)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>

        {prof && (
          <div className="card cs-prof-card">
            <p className="cs-card-label">Professor responsável</p>
            <div className="user-cell">
              <Avatar name={prof.name} size={36} />
              <div>
                <p className="user-name">{prof.name}</p>
                <p className="user-email">{prof.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="cs-students-header">
            <h2>Alunos <span className="tab-count">{classStudents.length}</span></h2>
          </div>

          {availableToAdd.length > 0 && (
            <div className="cs-add-panel">
              <div className="cs-add-toolbar">
                <div className="search-box" style={{ flex: 1 }}>
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Pesquisar aluno..."
                    value={addSearch}
                    onChange={e => setAddSearch(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <button
                  className="submit-btn cs-add-btn"
                  onClick={handleAddStudents}
                  disabled={selectedIds.size === 0}
                >
                  Adicionar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </button>
              </div>

              <div className="cs-checklist">
                {filteredAvailable.length > 0 && (
                  <label className="cs-check-row cs-check-all">
                    <input
                      type="checkbox"
                      checked={filteredAvailable.length > 0 && filteredAvailable.every(a => selectedIds.has(a.id))}
                      onChange={() => toggleAll(filteredAvailable)}
                    />
                    <span className="cs-check-label" style={{ color: '#64748b', fontSize: 12 }}>
                      Selecionar todos ({filteredAvailable.length})
                    </span>
                  </label>
                )}
                {filteredAvailable.length === 0 && (
                  <p className="empty-msg" style={{ margin: '8px 0' }}>Nenhum aluno encontrado.</p>
                )}
                {filteredAvailable.map(a => (
                  <label key={a.id} className="cs-check-row">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(a.id)}
                      onChange={() => toggleStudent(a.id)}
                    />
                    <Avatar name={a.name} size={28} />
                    <div className="cs-check-label">
                      <span className="user-name" style={{ fontSize: 13 }}>{a.name}</span>
                      <span className="user-email">{a.email}</span>
                    </div>
                  </label>
                ))}
              </div>
              {addError && <p className="form-error" style={{ marginTop: 6 }}>{addError}</p>}
            </div>
          )}

          {classStudents.length === 0 ? (
            <p className="empty-msg">Nenhum aluno nesta turma ainda.</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr><th>Aluno</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {classStudents.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="user-cell">
                        <Avatar name={s.name} size={32} />
                        <div>
                          <p className="user-name">{s.name}</p>
                          <p className="user-email">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`active-badge ${s.is_active ? 'active-true' : 'active-false'}`}>
                        {s.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button className="icon-btn delete-btn" title="Remover da turma" onClick={() => handleRemoveStudent(s.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {editingClass && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingClass(null)}>
            <div className="modal-box">
              <div className="modal-header">
                <h2>Editar Turma</h2>
                <button className="modal-close" onClick={() => setEditingClass(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="modal-form">
                <div className="form-row">
                  <div className="form-field">
                    <label>Nome</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required disabled={editSaving} />
                  </div>
                  <div className="form-field">
                    <label>Curso</label>
                    <input type="text" value={editForm.course} onChange={e => setEditForm(f => ({ ...f, course: e.target.value }))} required disabled={editSaving} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Ano</label>
                    <input type="number" value={editForm.year} onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))} required disabled={editSaving} />
                  </div>
                  <div className="form-field">
                    <label>Professor</label>
                    <select value={editForm.teacher} onChange={e => setEditForm(f => ({ ...f, teacher: e.target.value }))} disabled={editSaving}>
                      <option value="">Sem professor</option>
                      {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                {editError && <p className="form-error">{editError}</p>}
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setEditingClass(null)} disabled={editSaving}>Cancelar</button>
                  <button type="submit" className="save-btn" disabled={editSaving}>{editSaving ? 'A guardar...' : 'Guardar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── List / Create view ──
  return (
    <section className="content-section">
      <div className="section-header">
        <h1>Turmas</h1>
        <div className="user-tabs">
          {[['list', 'Lista'], ['create', 'Nova Turma']].map(([id, label]) => (
            <button
              key={id}
              className={`user-tab ${classTab === id ? 'user-tab-active' : ''}`}
              onClick={() => setClassTab(id)}
            >
              {label}
              {id === 'list' && <span className="tab-count">{classes.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {classTab === 'list' && (
        <div className="card">
          {classes.length === 0 ? (
            <p className="empty-msg">Nenhuma turma criada ainda.</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr><th>Turma</th><th>Professor</th><th>Ano</th><th>Alunos</th><th></th></tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id}>
                    <td>
                      <div>
                        <p className="user-name">{cls.name}</p>
                        <p className="user-email">{cls.course}</p>
                      </div>
                    </td>
                    <td>
                      {cls.teacher_name
                        ? <div className="user-cell"><Avatar name={cls.teacher_name} size={28} /><span style={{ fontSize: 13 }}>{cls.teacher_name}</span></div>
                        : <span className="empty-prompt">—</span>}
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: 13 }}>{cls.year}</td>
                    <td><span className="tab-count">{cls.student_count}</span></td>
                    <td className="action-cell">
                      <button className="icon-btn cs-view-btn" title="Ver alunos" onClick={() => openDetail(cls)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button className="icon-btn edit-btn" title="Editar" onClick={() => openEdit(cls)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="icon-btn delete-btn" title="Eliminar" onClick={() => handleDelete(cls.id, cls.name)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {classTab === 'create' && (
        <div className="card">
          <h2>Nova Turma</h2>
          <form onSubmit={handleCreate} className="user-form">
            <div className="form-row">
              <div className="form-field">
                <label>Nome da turma</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Turma A" required disabled={submitting} />
              </div>
              <div className="form-field">
                <label>Curso</label>
                <input type="text" value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} placeholder="Ex: Informática" required disabled={submitting} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Ano</label>
                <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required disabled={submitting} />
              </div>
              <div className="form-field">
                <label>Professor</label>
                <select value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} disabled={submitting}>
                  <option value="">Sem professor</option>
                  {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            {formError && <p className="form-error">{formError}</p>}
            {formSuccess && <p className="form-success">{formSuccess}</p>}
            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setFormSuccess('') }} disabled={submitting}>Limpar</button>
              <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'A criar...' : 'Criar Turma'}</button>
            </div>
          </form>
        </div>
      )}

      {editingClass && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingClass(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2>Editar Turma</h2>
              <button className="modal-close" onClick={() => setEditingClass(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="modal-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Nome</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required disabled={editSaving} />
                </div>
                <div className="form-field">
                  <label>Curso</label>
                  <input type="text" value={editForm.course} onChange={e => setEditForm(f => ({ ...f, course: e.target.value }))} required disabled={editSaving} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Ano</label>
                  <input type="number" value={editForm.year} onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))} required disabled={editSaving} />
                </div>
                <div className="form-field">
                  <label>Professor</label>
                  <select value={editForm.teacher} onChange={e => setEditForm(f => ({ ...f, teacher: e.target.value }))} disabled={editSaving}>
                    <option value="">Sem professor</option>
                    {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              {editError && <p className="form-error">{editError}</p>}
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setEditingClass(null)} disabled={editSaving}>Cancelar</button>
                <button type="submit" className="save-btn" disabled={editSaving}>{editSaving ? 'A guardar...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
