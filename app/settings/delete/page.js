"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const response = await fetch("/api/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userData.user.id }),
    });
    const data = await response.json();

    if (data.error) {
      alert("Could not delete account: " + data.error);
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => router.push("/settings")} className="text-xs text-indigo-950/50 underline mb-4">Back to settings</button>
      <h1 className="font-display font-bold text-xl text-red-600 mb-4">Delete account</h1>
      <p className="text-sm text-indigo-950/70 mb-4">
        This permanently deletes your account and login. This cannot be undone. Your listings and chat history may remain visible to others unless removed separately first.
      </p>

      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="bg-red-600 text-white font-semibold rounded px-4 py-2 text-sm">
          I want to delete my account
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-red-600">Are you absolutely sure?</p>
          <button onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white font-semibold rounded px-4 py-2 text-sm disabled:opacity-50">
            {deleting ? "Deleting..." : "Yes, permanently delete my account"}
          </button>
        </div>
      )}
    </div>
  );
}