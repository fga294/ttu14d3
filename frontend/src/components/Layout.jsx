import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { role, isCoach, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0047AB] text-white px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-[#FFD700]">
          TTU14D3
        </Link>
        <div className="flex gap-4 items-center text-sm">
          <Link to="/" className="hover:text-[#FFD700]">Dashboard</Link>
          <Link to="/players" className="hover:text-[#FFD700]">Players</Link>
          <Link to="/games" className="hover:text-[#FFD700]">Games</Link>
          <Link to="/leaderboard" className="hover:text-[#FFD700]">POTM</Link>
          <Link to="/messages" className="hover:text-[#FFD700]">Messages</Link>
          <span className="text-xs opacity-70 capitalize">{role}</span>
          <button onClick={handleLogout} className="bg-[#FFD700] text-[#0047AB] px-3 py-1 rounded font-semibold text-xs">
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
