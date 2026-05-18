import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const adminName = localStorage.getItem('adminName') || 'Admin'

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin')
    }
  }, [navigate])

  function handleLogout() {
    localStorage.removeItem('adminLoggedIn')
    localStorage.removeItem('adminName')
    navigate('/admin')
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <span className="dashboard-logo">GEIA</span>
        <div className="dashboard-user">
          <span>{adminName}</span>
          <button onClick={handleLogout} className="logout-btn">Sair</button>
        </div>
      </header>

      <main className="dashboard-main">
        <h2>Painel de Administração</h2>
        <p>Bem-vindo, <strong>{adminName}</strong>.</p>
      </main>
    </div>
  )
}
