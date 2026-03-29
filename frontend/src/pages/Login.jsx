import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, var(--surface-900) 0%, var(--surface-800) 50%, var(--surface-900) 100%)" }}
    >
      {/* Decorative glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "var(--thunder-blue)" }}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm p-8 rounded-2xl"
        style={{
          background: "var(--surface-700)",
          border: "1px solid var(--surface-500)",
          boxShadow: "var(--shadow-elevated), 0 0 60px rgba(0, 71, 171, 0.08)",
        }}
      >
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black mb-4"
            style={{
              background: "var(--thunder-gold)",
              color: "var(--surface-900)",
              boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)",
            }}
          >
            TT
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--thunder-gold)" }}>
            TTU14D3
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Thornleigh Thunder U14 Div 3
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mb-4 px-3 py-2.5 rounded-lg text-sm flex items-center gap-2"
            style={{
              background: "var(--danger-dim)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
            role="alert"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-3 mb-6">
          <div>
            <label htmlFor="username" className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Enter your username"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-2.5 text-sm"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
}
