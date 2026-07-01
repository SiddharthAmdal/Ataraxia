import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Library", to: "/library" },
  { label: "Watchlist", to: "/watchlist" },
  { label: "Discover", to: "/discover" },
  { label: "Notifications", to: "/notifications" }
];

export function AppShell() {
  const { isLoggedIn, logout } = useAuth();

  return (
    <div className="min-h-screen bg-hero-noise">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="group">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accentSoft group-hover:text-accent transition-colors">
              Ataraxia
            </p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tighter text-white">
              Anime Portal
            </h1>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                    isActive
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
            
            {isLoggedIn ? (
              <button 
                onClick={logout}
                className="ml-4 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20"
              >
                Exit
              </button>
            ) : (
              <Link 
                to="/login"
                className="ml-4 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 transition-all shadow-xl"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
