"use client";
import { useEffect } from "react";
import { startPresenceHeartbeat } from "../lib/presence";

export default function PresenceTracker() {
  useEffect(function () {
    const stop = startPresenceHeartbeat();
    return stop;
  }, []);
  return null;
}