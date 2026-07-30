import { supabase } from "./supabaseClient";

export function startPresenceHeartbeat() {
  async function updateLastSeen() {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase.from("users").update({ last_seen: new Date().toISOString() }).eq("id", userData.user.id);
    }
  }
  updateLastSeen();
  const interval = setInterval(updateLastSeen, 20000);

  function handleVisibility() {
    if (document.visibilityState === "visible") updateLastSeen();
  }
  document.addEventListener("visibilitychange", handleVisibility);

  return function () {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}

export function isOnline(lastSeen) {
  if (!lastSeen) return false;
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  return diffMs < 90 * 1000;
}