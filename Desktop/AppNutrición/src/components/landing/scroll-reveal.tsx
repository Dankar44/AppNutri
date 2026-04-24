"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Direction = "up" | "left" | "right" | "none";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  once?: boolean;
}

const offsets: Record<Direction, string> = {
  up: "translateY(40px)",
  left: "translateX(-40px)",
  right: "translateX(40px)",
  none: "none",
};

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "none";
          if (once) observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: offsets[direction],
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

export function StaggerChildren({
  children,
  className = "",
  staggerMs = 100,
  direction = "up" as Direction,
}: {
  children: ReactNode[];
  className?: string;
  staggerMs?: number;
  direction?: Direction;
}) {
  return (
    <>
      {children.map((child, i) => (
        <ScrollReveal key={i} delay={i * staggerMs} direction={direction} className={className}>
          {child}
        </ScrollReveal>
      ))}
    </>
  );
}
