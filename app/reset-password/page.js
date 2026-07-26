"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(function (event) {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(function (result) {
      if (result.data.session) setReady(true);
    });
    return function () { listener.subscription.unsubscribe(); };
  }, []);

  async function handleUpdatePassword() {
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setSuccessMsg("Password updated. Redirecting to login...");
    setTimeout(function () { router.push("/"); }, 1500);
  }

  if (!ready) {
    return <p className="text-sm text-indigo-950/50 max-w-sm mx-auto mt-8">Checking your reset link...</p>;
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">Set a new password</h1>
      {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}
      {successMsg && <p className="text-sm text-green-700 mb-3">{successMsg}</p>}
      <div className="space-y-3">
        <input
          type="password"
          placeholder="New password (minimum 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-indigo-950/20 rounded px-3 py-2"
        />
        <button
          onClick={handleUpdatePassword}
          disabled={loading || password.length < 6}
          className="w-full bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-2 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save new password"}
        </button>
      </div>
    </div>
  );
}