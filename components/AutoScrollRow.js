"use client";
import { useEffect, useRef } from "react";

export default function AutoScrollRow({ children, speed }) {
  const containerRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const positionRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const intervalId = setInterval(function () {
      if (pausedRef.current) return;
      const maxScroll = container.scrollWidth / 2;
      if (maxScroll <= 0) return;

      positionRef.current += (speed || 0.5);
      if (positionRef.current >= maxScroll) {
        positionRef.current = 0;
      }

      container.scrollTo({ left: positionRef.current, behavior: "auto" });
    }, 30);

    return function () { clearInterval(intervalId); };
  }, [speed]);

  function pauseNow() {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }

  function syncPosition() {
    if (containerRef.current) {
      positionRef.current = containerRef.current.scrollLeft;
    }
  }

  function scheduleResume() {
    syncPosition();
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(function () {
      pausedRef.current = false;
    }, 2000);
  }

  useEffect(() => {
    window.addEventListener("mouseup", scheduleResume);
    window.addEventListener("touchend", scheduleResume);
    window.addEventListener("touchcancel", scheduleResume);
    return function () {
      window.removeEventListener("mouseup", scheduleResume);
      window.removeEventListener("touchend", scheduleResume);
      window.removeEventListener("touchcancel", scheduleResume);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={pauseNow}
      onTouchStart={pauseNow}
      className="flex gap-3 overflow-x-auto no-scrollbar"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {children}
    </div>
  );
}