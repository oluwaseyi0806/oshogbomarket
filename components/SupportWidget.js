"use client";
import { useState, useRef, useEffect } from "react";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hi! I am the OshogboMarket assistant. Ask me anything about buying, selling, or using the app." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input.trim() };
    const newMessages = messages.concat([userMessage]);
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const history = messages.map(function (m) { return { role: m.role, content: m.content }; });

    const response = await fetch("/api/ai/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage.content, history: history }),
    });
    const data = await response.json();
    setMessages(newMessages.concat([{ role: "assistant", content: data.reply }]));
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gold-500 text-indigo-950 shadow-lg flex items-center justify-center"
      >
        {open ? "X" : "AI"}
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-50 w-80 max-w-[90vw] h-96 bg-white rounded-lg shadow-2xl border border-indigo-950/10 flex flex-col overflow-hidden">
          <div className="bg-indigo-950 text-parchment px-3 py-2 font-display font-bold text-sm">
            OshogboMarket Assistant
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {messages.map(function (m, i) {
              return (
                <div key={i} className={"max-w-[85%] px-3 py-2 rounded-lg text-sm " + (m.role === "user" ? "bg-indigo-950 text-parchment ml-auto" : "bg-indigo-950/5 text-indigo-950")}>
                  {m.content}
                </div>
              );
            })}
            {loading && <div className="text-xs text-indigo-950/40">Thinking...</div>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendMessage} className="flex gap-1 p-2 border-t border-indigo-950/10">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 border border-indigo-950/20 rounded px-2 py-1 text-sm"
            />
            <button type="submit" disabled={loading} className="bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-1 text-sm disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}