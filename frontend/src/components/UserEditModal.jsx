import { useEffect, useState } from 'react'
import './UserEditModal.css'

export default function UserEditModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'aluno',
    custom_prompt: '',
    is_active: true,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'aluno',
        custom_prompt: user.custom_prompt || '',
        is_active: user.is_active ?? true,
      })
      setError('')
    }
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = { ...form }
    if (!payload.password) delete payload.password

    try {
      const res = await fetch(`/api/users/${user.id}/edit/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        onSaved()
        onClose()
      } else {
        setError(Object.values(data).flat().join(' ') || 'Erro ao guardar.')
      }
    } catch {
      setError('Erro ao conectar ao servidor.')
    } finally {
      setSaving(false)
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  if (!user) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Editar Utilizador</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="form-row">
            <div className="form-field">
              <label>Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                disabled={saving}
              />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Nova password <span className="label-hint">(deixa vazio para manter)</span></label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••"
                disabled={saving}
              />
            </div>
            <div className="form-field">
              <label>Função</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                disabled={saving}
              >
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="form-field toggle-field">
            <label>Estado</label>
            <button
              type="button"
              className={`toggle-btn ${form.is_active ? 'toggle-on' : 'toggle-off'}`}
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              disabled={saving}
            >
              <span className="toggle-thumb" />
              <span className="toggle-label">{form.is_active ? 'Ativo' : 'Inativo'}</span>
            </button>
          </div>

          <div className="form-field">
            <label>Prompt personalizado <span className="label-hint">(instruções para a IA)</span></label>
            <textarea
              value={form.custom_prompt}
              onChange={e => setForm(f => ({ ...f, custom_prompt: e.target.value }))}
              placeholder="Ex: Responde sempre em português e de forma simples..."
              rows={4}
              disabled={saving}
            />
          </div>

          {user.classes && user.classes.length > 0 && (
            <div className="form-field">
              <label>Turma(s)</label>
              <div className="modal-class-tags">
                {user.classes.map(c => (
                  <span key={c.id} className="class-tag">{c.name}</span>
                ))}
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
