import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Chat from './components/Chat'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import ActivatePage from './components/ActivatePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/activate/:token" element={<ActivatePage />} />
      </Routes>
    </BrowserRouter>
  )
}
