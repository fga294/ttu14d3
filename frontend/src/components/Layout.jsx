import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/players", label: "Players", icon: PlayersIcon },
  { to: "/formations", label: "Formations", icon: FormationIcon },
  { to: "/games", label: "Games", icon: GamesIcon },
];

export default function Layout() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-900)" }}>
      {/* ─── Desktop top bar ─── */}
      <nav
        className="hidden md:flex items-center justify-between px-6 py-3"
        style={{ background: "var(--surface-800)", borderBottom: "1px solid var(--surface-600)" }}
      >
        <Link to="/" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: "var(--thunder-gold)", color: "var(--surface-900)" }}
          >
            TT
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: "var(--thunder-gold)" }}>
              TTU14D3
            </span>
            <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
              Thornleigh Thunder
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
              style={{
                color: isActive(item.to) ? "var(--thunder-gold)" : "var(--text-secondary)",
                background: isActive(item.to) ? "var(--thunder-gold-glow)" : "transparent",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.to)) e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.to)) e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="badge badge-blue capitalize">{role}</span>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 rounded-md"
            style={{
              color: "var(--text-secondary)",
              background: "var(--surface-600)",
              border: "1px solid var(--surface-500)",
              transition: "var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-500)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface-600)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* ─── Mobile top bar (slim) ─── */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3"
        style={{ background: "var(--surface-800)", borderBottom: "1px solid var(--surface-600)" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: "var(--thunder-gold)", color: "var(--surface-900)" }}
          >
            TT
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--thunder-gold)" }}>
            TTU14D3
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="badge badge-blue capitalize text-[0.6rem]">{role}</span>
          <button
            onClick={handleLogout}
            className="text-xs px-2 py-1 rounded"
            style={{ color: "var(--text-muted)", background: "var(--surface-600)" }}
          >
            Out
          </button>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8 pb-24 md:pb-8">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>

      {/* ─── Mobile bottom tab bar ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center"
        style={{
          background: "var(--surface-800)",
          borderTop: "1px solid var(--surface-600)",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
          paddingTop: "6px",
        }}
      >
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-0.5 py-1 px-2 min-w-[3.5rem]"
            style={{
              color: isActive(item.to) ? "var(--thunder-gold)" : "var(--text-muted)",
              transition: "var(--transition-fast)",
            }}
          >
            <item.icon size={20} />
            <span className="text-[0.6rem] font-medium">{item.label}</span>
            {isActive(item.to) && (
              <div
                className="absolute top-0 w-8 h-0.5 rounded-full"
                style={{ background: "var(--thunder-gold)" }}
              />
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/* ─── Inline SVG Icons (minimal, no extra deps) ─── */
function HomeIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PlayersIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function GamesIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function FormationIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
