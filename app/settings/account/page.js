"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handlePhoneSave() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    await supabase.from("users").update({ phone_number: newPhone }).eq("id", userData.user.id);
    setMsg("Phone number updated.");
  }

  async function handleEmailSave() {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("Check your new email inbox to confirm the change.");
  }

  async function handlePasswordSave() {
    if (newPassword.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("Password updated.");
    setNewPassword("");
  }

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => router.push("/settings")} className="text-xs text-indigo-950/50 underline mb-4">Back to settings</button>
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">Account</h1>

      {msg && <p className="text-sm text-green-700 mb-3">{msg}</p>}

      <div className="space-y-6">
        <div className="bg-white border border-indigo-950/10 rounded-lg p-4">
          <p className="font-semibold text-sm text-indigo-950 mb-2">Change phone number</p>
          <div className="flex gap-2">
            <input type="tel" placeholder="New phone number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="flex-1 border border-indigo-950/20 rounded px-3 py-2 text-sm" />
            <button onClick={handlePhoneSave} className="bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-2 text-sm">Save</button>
          </div>
        </div>

        <div className="bg-white border border-indigo-950/10 rounded-lg p-4">
          <p className="font-semibold text-sm text-indigo-950 mb-2">Change email</p>
          <div className="flex gap-2">
            <input type="email" placeholder="New email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="flex-1 border border-indigo-950/20 rounded px-3 py-2 text-sm" />
            <button onClick={handleEmailSave} className="bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-2 text-sm">Save</button>
          </div>
        </div>

        <div className="bg-white border border-indigo-950/10 rounded-lg p-4">
          <p className="font-semibold text-sm text-indigo-950 mb-2">Change password</p>
          <div className="flex gap-2">
            <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="flex-1 border border-indigo-950/20 rounded px-3 py-2 text-sm" />
            <button onClick={handlePasswordSave} className="bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-2 text-sm">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}