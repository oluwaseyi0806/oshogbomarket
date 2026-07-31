"use client";
import { useEffect, useRef, useState } from "react";

export default function AutoScrollRow({ children, speed }) {
  const containerRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const resumeTimeoutRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId;
    function step() {
      if (container && !paused) {
        const maxScroll = container.scrollWidth / 2;
        if (maxScroll > 0) {
          let next = container.scrollLeft + (speed || 0.5);
          if (next >= maxScroll) next = 0;
          container.scrollLeft = next;
        }
      }
      frameId = requestAnimationFrame(step);
    }
    frameId = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(frameId); };
  }, [paused, speed]);

  function pauseNow() {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    setPaused(true);
  }

  function scheduleResume() {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(function () {
      setPaused(false);
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