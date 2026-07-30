"use client";
import { useEffect, useRef } from "react";

export default function AutoScrollRow({ children, speed }) {
  const containerRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let frameId;
    function step() {
      if (!pausedRef.current && container) {
        container.scrollLeft += speed || 0.5;
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      frameId = requestAnimationFrame(step);
    }
    frameId = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(frameId); };
  }, [speed]);

  function pause() {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }
  function scheduleResume() {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(function () { pausedRef.current = false; }, 2500);
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={pause}
      onPointerUp={scheduleResume}
      onTouchStart={pause}
      onTouchEnd={scheduleResume}
      onMouseEnter={pause}
      onMouseLeave={scheduleResume}
      className="flex gap-3 overflow-x-auto no-scrollbar"
    >
      {children}
    </div>
  );
}