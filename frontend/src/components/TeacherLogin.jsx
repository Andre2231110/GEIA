import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TeacherLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/teacher/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("teacher", JSON.stringify(data));
        navigate("/backoffice/dashboard");
      } else {
        setError(data.error || "Credenciais inválidas.");
      }
    } catch {
      setError("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-10 md:p-12">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl">
              G
            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              Entrar no Backoffice
            </h2>

            <p className="text-slate-500 mt-2">
              Acesso exclusivo para professores.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                E-mail
              </label>

              <input
                type="email"
                placeholder="professor@escola.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border text-black px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Palavra-passe
              </label>

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border text-black px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "A entrar..." : "Entrar"}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-8">
            Apenas professores autorizados podem aceder a esta área.
          </p>
        </div>
      </div>
    </div>
  );
}