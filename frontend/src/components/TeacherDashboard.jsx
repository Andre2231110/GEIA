import './TeacherDashboard.css'

export default function TeacherDashboard() {
  const teacher = JSON.parse(
    localStorage.getItem('teacher')
  )

  return (
    <div className="teacher-layout">

      <aside className="teacher-sidebar">
        <div className="teacher-logo">
          GEIA
        </div>

        <nav className="teacher-nav">
          <button>Dashboard</button>
          <button>Turmas</button>
          <button>Alunos</button>
          <button>Assistente IA</button>
        </nav>

        <div className="teacher-user">
          <div className="teacher-avatar">
            {teacher?.name?.[0]?.toUpperCase()}
          </div>

          <div>
            <div className="teacher-name">
              {teacher?.name}
            </div>

            <div className="teacher-role">
              Professor
            </div>
          </div>
        </div>
      </aside>

      <main className="teacher-main">

        <h1>
          Bem-vindo, {teacher?.name}
        </h1>

        <div className="teacher-cards">

          <div className="teacher-card">
            <h2>Turmas</h2>
            <p>0</p>
          </div>

          <div className="teacher-card">
            <h2>Alunos</h2>
            <p>0</p>
          </div>

          <div className="teacher-card">
            <h2>Conversas</h2>
            <p>0</p>
          </div>

        </div>

      </main>

    </div>
  )
}