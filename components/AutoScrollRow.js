"use client";
import { useEffect, useRef } from "react";

export default function AutoScrollRow({ children, speed }) {
  const containerRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const lastAutoLeftRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId;
    function step() {
      if (container && !isUserScrollingRef.current) {
        const maxScroll = container.scrollWidth / 2;
        let next = container.scrollLeft + (speed || 0.5);
        if (maxScroll > 0 && next >= maxScroll) next = 0;
        container.scrollLeft = next;
        lastAutoLeftRef.current = container.scrollLeft;
      }
      frameId = requestAnimationFrame(step);
    }
    frameId = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(frameId); };
  }, [speed]);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    if (Math.abs(container.scrollLeft - lastAutoLeftRef.current) > 2) {
      isUserScrollingRef.current = true;
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = setTimeout(function () {
        isUserScrollingRef.current = false;
      }, 2000);
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex gap-3 overflow-x-auto no-scrollbar"
    >
      {children}
    </div>
  );
}