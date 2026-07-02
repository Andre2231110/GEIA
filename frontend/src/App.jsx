import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Chat from './components/Chat'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import ActivatePage from './components/ActivatePage'
import TeacherLogin from './components/TeacherLogin'
import TeacherDashboard from './components/TeacherDashboard'
import NotFound from './components/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/backoffice" element={<TeacherLogin />} />
        <Route path="/backoffice/dashboard" element={<TeacherDashboard/>} />
        <Route path="/activate/:token" element={<ActivatePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
