"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const IDLE_LIMIT_MS = 60 * 60 * 1000;

export default function IdleLogout() {
  const router = useRouter();

  useEffect(() => {
    let timer;

    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(async function () {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.auth.signOut();
          router.push("/auth");
        }
      }, IDLE_LIMIT_MS);
    }

    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach(function (e) { window.addEventListener(e, resetTimer); });
    resetTimer();

    return function () {
      clearTimeout(timer);
      events.forEach(function (e) { window.removeEventListener(e, resetTimer); });
    };
  }, [router]);

  return null;
}