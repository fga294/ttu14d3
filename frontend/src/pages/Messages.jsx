import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Messages() {
  const { isCoach } = useAuth();
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ author: "", content: "" });

  useEffect(() => {
    const endpoint = isCoach ? "/messages/all" : "/messages";
    api.get(endpoint).then(setMessages);
  }, [isCoach]);

  const handlePost = async (e) => {
    e.preventDefault();
    const msg = await api.post("/messages", form);
    setMessages([msg, ...messages]);
    setForm({ author: "", content: "" });
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
      <h1 className="text-2xl font-bold text-[#0047AB] mb-4">Messages</h1>

      <form onSubmit={handlePost} className="mb-6 space-y-2">
        <input placeholder="Your name" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
          className="border rounded px-3 py-2 w-full text-sm" required />
        <textarea placeholder="Write a message..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="border rounded px-3 py-2 w-full text-sm" rows={3} required />
        <button type="submit" className="bg-[#FFD700] text-[#0047AB] font-bold px-4 py-2 rounded text-sm">Post</button>
      </form>

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`bg-white rounded shadow p-4 ${!m.approved ? "border-l-4 border-yellow-400" : ""}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="font-semibold">{m.author}</span>
                <span className="text-xs text-gray-400 ml-2">{new Date(m.created_at).toLocaleDateString()}</span>
                {!m.approved && <span className="text-xs text-yellow-600 ml-2 font-medium">Pending</span>}
              </div>
              {isCoach && (
                <div className="flex gap-2">
                  {!m.approved && (
                    <button onClick={() => handleApprove(m.id)} className="text-xs text-green-600 hover:underline">
                      Approve
                    </button>
                  )}
                  <button onClick={() => handleDelete(m.id)} className="text-xs text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-700">{m.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
