import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="glass-panel rounded-3xl p-10 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-accentSoft">
        404
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">Page not found</h2>
      <p className="mt-3 text-slate-300">
        The route does not exist in this media app.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 font-semibold text-black transition hover:bg-accentSoft"
      >
        Return home
      </Link>
    </div>
  );
}
