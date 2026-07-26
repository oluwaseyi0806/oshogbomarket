"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSignUp() {
    setLoading(true);
    setErrorMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase.from("users").upsert({ id: data.user.id, name: name || "Osogbo user" });
    }
    setLoading(false);
    router.push("/");
  }

  async function handleLogin() {
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg("Incorrect email or password.");
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push("/");
  }

  if (!mode) {
    return (
      <div className="max-w-sm mx-auto mt-8 space-y-3">
        <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">Welcome to OshogboMarket</h1>
        <button onClick={() => setMode("signup")} className="w-full bg-indigo-950 text-parchment font-semibold rounded px-3 py-3">
          New here? Create an account
        </button>
        <button onClick={() => setMode("login")} className="w-full bg-white border border-indigo-950/20 text-indigo-950 font-semibold rounded px-3 py-3">
          I already have an account - Log in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <button onClick={() => { setMode(null); setErrorMsg(""); }} className="text-xs text-indigo-950/50 underline mb-4">
        Back
      </button>
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">
        {mode === "signup" ? "Create your account" : "Log in"}
      </h1>

      {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}

      <div className="space-y-3">
        {mode === "signup" && (
          <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        )}
        <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <input type="password" placeholder="Password (minimum 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <button
          onClick={mode === "signup" ? handleSignUp : handleLogin}
          disabled={loading || !email || !password}
          className="w-full bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-2 disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </div>
    </div>
  );
}