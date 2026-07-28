import { supabase } from "./supabaseClient";

export function startPresenceHeartbeat() {
  async function updateLastSeen() {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase.from("users").update({ last_seen: new Date().toISOString() }).eq("id", userData.user.id);
    }
  }
  updateLastSeen();
  const interval = setInterval(updateLastSeen, 60000);
  return function () { clearInterval(interval); };
}

export function isOnline(lastSeen) {
  if (!lastSeen) return false;
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  return diffMs < 3 * 60 * 1000;
}