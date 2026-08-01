"use client";
import { useEffect, useRef } from "react";

export default function AutoScrollRow({ children, speed }) {
  const containerRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const intervalId = setInterval(function () {
      if (pausedRef.current) return;
      const maxScroll = container.scrollWidth / 2;
      if (maxScroll <= 0) return;
      let next = container.scrollLeft + (speed || 0.5);
      if (next >= maxScroll) next = 0;
      container.scrollLeft = next;
    }, 16);

    return function () { clearInterval(intervalId); };
  }, [speed]);

  function pauseNow() {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }

  function scheduleResume() {
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
    >
      {children}
    </div>
  );
}