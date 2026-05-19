import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Chat from './components/Chat'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import ActivatePage from './components/ActivatePage'

function Home() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('http://localhost:8000/api/hello/')
      .then(res => res.json())
      .then(data => setMessage(data.message))
  }, [])

  return (
    <div>
      <h1>{message}</h1>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/api/frontOffice" element={<Chat />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/activate/:token" element={<ActivatePage />} />
      </Routes>
    </BrowserRouter>
  )
}
