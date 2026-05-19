import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import './ActivatePage.css'

export default function ActivatePage() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/users/activate/${token}/`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setName(data.name)
          setStatus('success')
        } else {
          setError(data.error || 'Erro ao ativar conta.')
          setStatus('error')
        }
      })
      .catch(() => {
        setError('Erro ao conectar ao servidor.')
        setStatus('error')
      })
  }, [token])

  return (
    <div className="activate-wrapper">
      <div className="activate-card">
        <div className="activate-logo">GEIA</div>

        {status === 'loading' && (
          <>
            <div className="activate-spinner" />
            <p className="activate-msg">A verificar o teu link...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="activate-icon activate-icon-ok">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="activate-title">Conta ativada!</h1>
            <p className="activate-msg">Bem-vindo, <strong>{name}</strong>. A tua conta está agora ativa.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="activate-icon activate-icon-err">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 className="activate-title">Link inválido</h1>
            <p className="activate-msg">{error}</p>
          </>
        )}
      </div>
    </div>
  )
}
