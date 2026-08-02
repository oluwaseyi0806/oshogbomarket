"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SettingsPage() {
  const router = useRouter();
  const [chatsDisabled, setChatsDisabled] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push("/auth");
      return;
    }
    setUserId(userData.user.id);
    const { data: profile } = await supabase.from("users").select("chats_disabled").eq("id", userData.user.id).single();
    setChatsDisabled(!!profile?.chats_disabled);
  }

  async function toggleChatsDisabled() {
    const newValue = !chatsDisabled;
    await supabase.from("users").update({ chats_disabled: newValue }).eq("id", userId);
    setChatsDisabled(newValue);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }
  const rows = [
    { label: "Invite and earn", href: "/referrals" },
    { label: "Personal details", href: "/settings/personal" },
  ];
  const rows = [
    { label: "Personal details", href: "/settings/personal" },
    { label: "Change phone number", href: "/settings/account" },
    { label: "Change email", href: "/settings/account" },
    { label: "Change password", href: "/settings/account" },
    { label: "Delete account", href: "/settings/delete" },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">Settings</h1>

      <div className="bg-white border border-indigo-950/10 rounded-lg divide-y divide-indigo-950/5">
        {rows.map(function (row) {
          return (
            <Link key={row.label} href={row.href} className="flex items-center justify-between px-4 py-3 hover:bg-indigo-950/5">
              <span className="text-sm text-indigo-950">{row.label}</span>
              <span className="text-indigo-950/40">{">"}</span>
            </Link>
          );
        })}

        <button onClick={toggleChatsDisabled} className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-950/5 text-left">
          <span className="text-sm text-indigo-950">Disable chats</span>
          <span className={"text-xs font-bold px-2 py-1 rounded " + (chatsDisabled ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700")}>
            {chatsDisabled ? "Disabled" : "Enabled"}
          </span>
        </button>

        <button onClick={logout} className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-950/5 text-left">
          <span className="text-sm text-red-600 font-semibold">Log out</span>
          <span className="text-indigo-950/40">{">"}</span>
        </button>
      </div>
    </div>
  );
}