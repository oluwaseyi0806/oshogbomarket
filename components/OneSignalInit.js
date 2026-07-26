"use client";
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function OneSignalInit() {
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({ appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID });

      await OneSignal.Notifications.requestPermission();

      const subscriptionId = OneSignal.User.PushSubscription.id;
      if (subscriptionId) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.from("users").update({ onesignal_player_id: subscriptionId }).eq("id", userData.user.id);
        }
      }
    });
  }, []);

  return null;
}