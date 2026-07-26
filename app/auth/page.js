"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function sendOtp() {
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: mode === "signup" },
    });
    setLoading(false);
    if (error) {
      if (mode === "login") {
        setErrorMsg("No account found with this email. Try Sign Up instead.");
      } else {
        setErrorMsg(error.message);
      }
      return;
    }
    setStep("otp");
  }

  async function verifyOtp() {
    setLoading(true);
    setErrorMsg("");
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }
    await supabase.from("users").upsert({ id: data.user.id, name: name || "Osogbo user" });
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
      <button onClick={() => { setMode(null); setStep("email"); setErrorMsg(""); }} className="text-xs text-indigo-950/50 underline mb-4">
        Back
      </button>
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">
        {step === "email" ? (mode === "signup" ? "Create your account" : "Log in") : "Enter the code we sent"}
      </h1>

      {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}

      {step === "email" ? (
        <div className="space-y-3">
          {mode === "signup" && (
            <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
          )}
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
          <button onClick={sendOtp} disabled={loading || !email} className="w-full bg-indigo-950 text-parchment font-semibold rounded px-3 py-2 disabled:opacity-50">
            {loading ? "Sending..." : "Send code"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-indigo-950/60">Check your email for a 6-digit code.</p>
          <input type="text" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
          <button onClick={verifyOtp} disabled={loading || !otp} className="w-full bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-2 disabled:opacity-50">
            {loading ? "Verifying..." : "Verify and continue"}
          </button>
        </div>
      )}
    </div>
  );
}