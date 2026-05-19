import { useState } from 'react'
import './BulkImportCard.css'

const VALID_ROLES = ['aluno', 'professor', 'admin']

function parsePaste(text) {
  const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l.trim())
  return lines.map((line, i) => {
    const sep = line.includes('\t') ? '\t' : ','
    const cols = line.split(sep).map(c => c.trim())
    const [name = '', email = '', password = '', role = '', custom_prompt = ''] = cols

    const errs = []
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!name) errs.push('nome obrigatório')
    if (!email || !emailOk) errs.push('email inválido (ex: nome@dominio.com)')
    if (!password) errs.push('password obrigatória')
    if (!VALID_ROLES.includes(role.toLowerCase())) errs.push(`role inválido (use: ${VALID_ROLES.join(', ')})`)

    return {
      _row: i + 1,
      name,
      email,
      password,
      role: role.toLowerCase(),
      custom_prompt,
      _errors: errs,
    }
  })
}

export default function BulkImportCard({ onImported }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [importing, setImporting] = useState(false)

  const rows = text.trim() ? parsePaste(text) : []
  const validRows = rows.filter(r => r._errors.length === 0)
  const invalidRows = rows.filter(r => r._errors.length > 0)

  async function handleImport() {
    if (!validRows.length) return
    setImporting(true)
    setResult(null)

    const payload = validRows.map(({ _row, _errors, ...u }) => u)

    try {
      const res = await fetch('/api/users/bulk-create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: payload }),
      })
      const data = await res.json()
      setResult(data)
      if (data.created > 0) {
        setText('')
        onImported()
      }
    } catch {
      setResult({ error: 'Erro ao conectar ao servidor.' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="bulk-card">
      <h2>Importar em Massa</h2>
      <p className="bulk-hint">
        Cola linhas copiadas do Excel. Colunas por ordem:
        <code>nome · email · password · role · prompt (opcional)</code>
      </p>

      <textarea
        className="bulk-textarea"
        placeholder={`João Silva\tjoao@escola.pt\t123456\taluno\nMaria Santos\tmaria@escola.pt\t123456\tprofessor`}
        value={text}
        onChange={e => { setText(e.target.value); setResult(null) }}
        rows={6}
        disabled={importing}
      />

      {rows.length > 0 && (
        <div className="bulk-preview">
          <div className="preview-summary">
            <span className="summary-ok">{validRows.length} válidos</span>
            {invalidRows.length > 0 && (
              <span className="summary-err">{invalidRows.length} com erro</span>
            )}
          </div>

          <table className="preview-table">
            <thead>
              <tr>
                <th>#</th><th>Nome</th><th>Email</th><th>Role</th><th>Prompt</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._row} className={r._errors.length ? 'row-invalid' : 'row-valid'}>
                  <td>{r._row}</td>
                  <td>{r.name || <span className="cell-empty">—</span>}</td>
                  <td>{r.email || <span className="cell-empty">—</span>}</td>
                  <td>{r.role ? <span className={`badge badge-${r.role}`}>{r.role}</span> : <span className="cell-empty">—</span>}</td>
                  <td className="prompt-cell">{r.custom_prompt || <span className="cell-empty">—</span>}</td>
                  <td>
                    {r._errors.length === 0
                      ? <span className="status-ok">OK</span>
                      : <span className="status-err" title={r._errors.join(', ')}>Erro</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invalidRows.length > 0 && (
            <ul className="error-list">
              {invalidRows.map(r => (
                <li key={r._row}>Linha {r._row}: {r._errors.join(', ')}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result && (
        <div className={`import-result ${result.error || result.errors?.length ? 'result-error' : 'result-ok'}`}>
          {result.error
            ? result.error
            : (
              <>
                {result.created > 0 && (
                  <p style={{ margin: '0 0 6px' }}>{result.created} utilizador(es) criado(s) com sucesso.</p>
                )}
                {result.errors?.map(e => (
                  <p key={e.row} style={{ margin: '2px 0' }}>
                    Linha {e.row}: {Object.entries(e.errors).map(([f, msgs]) => `${f}: ${msgs.join(', ')}`).join(' · ')}
                  </p>
                ))}
                {result.email_errors?.length > 0 && (
                  <p style={{ margin: '6px 0 0', color: '#fbbf24' }}>
                    Erro ao enviar email para: {result.email_errors.map(e => `${e.user} (${e.error})`).join(', ')}
                  </p>
                )}
              </>
            )}
        </div>
      )}

      <button
        className="import-btn"
        onClick={handleImport}
        disabled={importing || validRows.length === 0}
      >
        {importing ? 'A importar...' : `Importar ${validRows.length > 0 ? validRows.length : ''} utilizador(es)`}
      </button>
    </div>
  )
}
