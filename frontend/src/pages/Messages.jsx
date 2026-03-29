import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Messages() {
  const { isCoach } = useAuth();
  const [messages, setMessages] = useState(null);
  const [form, setForm] = useState({ author: "", content: "" });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const endpoint = isCoach ? "/messages/all" : "/messages";
    api.get(endpoint).then(setMessages);
  }, [isCoach]);

  const handlePost = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      const msg = await api.post("/messages", form);
      setMessages([msg, ...(messages || [])]);
      setForm({ author: "", content: "" });
    } finally {
      setPosting(false);
    }
  };

  const handleApprove = async (id) => {
    const updated = await api.put(`/messages/${id}/approve`);
    setMessages(messages.map((m) => (m.id === id ? updated : m)));
  };

  const handleDelete = async (id) => {
    await api.del(`/messages/${id}`);
    setMessages(messages.filter((m) => m.id !== id));
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Messages</h1>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Team communication board</p>
      </div>

      {/* Post form */}
      <form onSubmit={handlePost} className="card-static p-4 mb-6">
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>POST A MESSAGE</p>
        <div className="space-y-2">
          <input
            placeholder="Your name"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            className="input-field"
            required
          />
          <textarea
            placeholder="Write a message to the team..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="input-field"
            style={{ resize: "vertical", minHeight: "5rem" }}
            rows={3}
            required
          />
          <div className="flex justify-between items-center">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {isCoach ? "Messages post immediately." : "Messages require coach approval."}
            </p>
            <button type="submit" className="btn-primary" disabled={posting}>
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </form>

      {/* Messages list */}
      {messages === null ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-static p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="skeleton h-4 w-24" />
              </div>
              <div className="skeleton h-4 w-full mb-1.5" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="card-static p-8 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--surface-600)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <p className="font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
            No messages yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Be the first to post something to the team!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className="card-static p-4"
              style={!m.approved ? { borderLeft: "3px solid var(--warning)" } : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {/* Author avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--thunder-blue-glow)", color: "var(--thunder-blue-light)" }}
                  >
                    {m.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {m.author}
                    </span>
                    <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                    {!m.approved && <span className="badge badge-warning ml-2">Pending</span>}
                  </div>
                </div>

                {/* Coach actions */}
                {isCoach && (
                  <div className="flex items-center gap-1 shrink-0">
                    {!m.approved && (
                      <button
                        onClick={() => handleApprove(m.id)}
                        className="text-xs font-medium px-2 py-1 rounded"
                        style={{
                          color: "var(--success)",
                          background: "rgba(34,197,94,0.1)",
                          transition: "var(--transition-fast)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.1)")}
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{
                        color: "var(--danger)",
                        background: "rgba(239,68,68,0.1)",
                        transition: "var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {m.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
