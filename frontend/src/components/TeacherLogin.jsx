import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './TeacherLogin.css'

export default function TeacherLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  async function handleSubmit(e) {
  e.preventDefault()

  setError('')
  setLoading(true)

  try {
    const response = await fetch(
      'http://localhost:8000/api/teacher/login/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.error || 'Erro ao autenticar.'
      )
    }

    localStorage.setItem(
      'teacher',
      JSON.stringify(data)
    )

    navigate('/backoffice/dashboard')
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

return (
  <div className="teacher-login-page">
  <div className="teacher-login-card">

    <h1 className="teacher-login-logo">
      GEIA
    </h1>

    <p className="teacher-login-subtitle">
      Backoffice Professor
    </p>

    <form onSubmit={handleSubmit}>
      <div className="teacher-field">
        <label>Email</label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="teacher-field">
        <label>Password</label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="teacher-error">
          {error}
        </p>
      )}

      <button
        className="teacher-login-btn"
        type="submit"
      >
        Entrar
      </button>
    </form>

  </div>
</div>
)
}