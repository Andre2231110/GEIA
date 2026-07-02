import { useState, useEffect } from 'react'
import './TeacherDashboard.css'

function timeAgo(isoDate) {
  const diff = Math.floor((Date.now() - new Date(isoDate)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  return `há ${Math.floor(diff / 86400)} d`
}

function DoubtItem({ d, onMarkRead }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`teacher-doubt-item ${d.is_read ? '' : 'teacher-doubt-unread'}`}>
      <div className="teacher-q-avatar">{d.student_name[0].toUpperCase()}</div>
      <div className="teacher-q-content" style={{ flex: 1, minWidth: 0 }}>
        <div className="teacher-doubt-description">{d.description}</div>
        <div className="teacher-q-meta">
          <span>{d.student_name}</span>
          <span className="teacher-q-dot">·</span>
          <span>{d.class_name}</span>
          <span className="teacher-q-dot">·</span>
          <span>{timeAgo(d.created_at)}</span>
        </div>

        {d.messages && d.messages.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button className="teacher-expand-btn" onClick={() => setExpanded(v => !v)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              {expanded ? 'Ocultar conversa' : `Ver conversa "${d.conversation_title || 'sem título'}"`}
            </button>

            {expanded && (
              <div className="teacher-chat-preview">
                {d.messages.map((m, i) => (
                  <div key={i} className={`teacher-chat-msg ${m.role}`}>
                    <span className="teacher-chat-role">{m.role === 'user' ? d.student_name.split(' ')[0] : 'IA'}</span>
                    <p>{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {!d.is_read && (
        <button className="teacher-mark-read" onClick={() => onMarkRead(d.id)}>
          Marcar como lida
        </button>
      )}
    </div>
  )
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const teacher = JSON.parse(localStorage.getItem("teacher"));

  const [stats, setStats] = useState({
    total_turmas: 0,
    total_alunos: 0,
    total_conversas: 0,
  });

  useEffect(() => {
    if (!teacher) {
      navigate("/backoffice");
      return;
    }

    fetch(`http://localhost:8000/api/teacher/${teacher.id}/stats/`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => console.log("Erro ao carregar estatísticas"));
  }, []);

  function handleLogout() {
    localStorage.removeItem("teacher");
    navigate("/backoffice");
  }
  const [teacher] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teacher')) } catch { return null }
  })

  const [stats, setStats] = useState({ total_turmas: 0, total_alunos: 0, total_conversas: 0 })
  const [doubts, setDoubts] = useState([])
  const [loadingD, setLoadingD] = useState(true)

  useEffect(() => {
    if (!teacher?.id) { setLoadingD(false); return }

    fetch(`/api/teacher/${teacher.id}/stats`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})

    fetch(`/api/teacher/${teacher.id}/doubts/`)
      .then(r => r.json())
      .then(d => setDoubts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingD(false))
  }, [teacher?.id])

  async function markRead(id) {
    await fetch(`/api/teacher/doubts/${id}/mark-read/`, { method: 'PATCH' })
    setDoubts(prev => prev.map(d => d.id === id ? { ...d, is_read: true } : d))
  }

  const unread = doubts.filter(d => !d.is_read).length

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-72 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xl">
              G
            </div>
            <div>
              <h1 className="font-bold text-xl">GEIA</h1>
              <p className="text-xs text-slate-400">Backoffice</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 font-medium">
            Dashboard
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800">
            Turmas
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800">
            Alunos
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800">
            Conversas
          </button>
    <div className="teacher-layout">
      <aside className="teacher-sidebar">
        <div className="teacher-logo">GEIA</div>
        <nav className="teacher-nav">
          <button>Dashboard</button>
          <button>Turmas</button>
          <button>Alunos</button>
          <button>Assistente IA</button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {teacher?.name?.[0]?.toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="font-medium truncate">{teacher?.name}</p>
              <p className="text-xs text-slate-400 truncate">{teacher?.email}</p>
            </div>
        <div className="teacher-user">
          <div className="teacher-avatar">{teacher?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="teacher-name">{teacher?.name}</div>
            <div className="teacher-role">Professor</div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-slate-800 py-2 text-sm hover:bg-slate-700"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Dashboard
          </h2>
          <p className="text-slate-500 mt-1">
            Bem-vindo, {teacher?.name}. Aqui pode acompanhar as suas turmas.
          </p>
        </header>
      <main className="teacher-main">
        <h1>Bem-vindo, {teacher?.name}</h1>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Turmas</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2">
              {stats.total_turmas}
            </h3>
        <div className="teacher-cards">
          <div className="teacher-card"><h2>Turmas</h2><p>{stats.total_turmas}</p></div>
          <div className="teacher-card"><h2>Alunos</h2><p>{stats.total_alunos}</p></div>
          <div className="teacher-card"><h2>Conversas</h2><p>{stats.total_conversas}</p></div>
          <div className={`teacher-card ${unread > 0 ? 'teacher-card-alert' : ''}`}>
            <h2>Dúvidas por responder</h2>
            <p>{unread}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Alunos</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2">
              {stats.total_alunos}
            </h3>
          </div>
        </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Conversas</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2">
              {stats.total_conversas}
            </h3>
        <div className="teacher-section">
          <div className="teacher-section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h2>Dúvidas dos Alunos</h2>
            {unread > 0 && <span className="teacher-badge">{unread} nova{unread !== 1 ? 's' : ''}</span>}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Resumo das turmas
          </h3>
          <p className="text-slate-500">
            Nesta primeira versão, esta área vai mostrar estatísticas gerais.
            Depois podemos ligar aqui os dados processados da `processed_db`.
          </p>
        </section>

          {loadingD && <p className="teacher-empty">A carregar...</p>}
          {!loadingD && doubts.length === 0 && (
            <p className="teacher-empty">Nenhuma dúvida recebida ainda.</p>
          )}
          {!loadingD && doubts.length > 0 && (
            <div className="teacher-doubts">
              {doubts.map(d => <DoubtItem key={d.id} d={d} onMarkRead={markRead} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
