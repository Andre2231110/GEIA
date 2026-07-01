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

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Turmas</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2">
              {stats.total_turmas}
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Alunos</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2">
              {stats.total_alunos}
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Conversas</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2">
              {stats.total_conversas}
            </h3>
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
      </main>
    </div>
  );
}