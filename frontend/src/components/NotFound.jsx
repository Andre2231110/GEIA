import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
      <div className="text-center max-w-lg">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">
          G
        </div>

        <h1 className="text-7xl font-bold text-slate-900">404</h1>

        <h2 className="mt-4 text-3xl font-semibold text-slate-800">
          Página não encontrada
        </h2>

        <p className="mt-4 text-slate-500 leading-relaxed">
          O endereço que tentou aceder não existe ou foi removido.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Ir para o Chat
          </Link>

          <Link
            to="/backoffice"
            className="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-200 transition"
          >
            Backoffice
          </Link>
        </div>
      </div>
    </div>
  );
}