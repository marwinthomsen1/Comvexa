"use client";
import { useEffect } from "react";
import { installScrollMotion } from "@/lib/motion/scroll-motion";
export function MotionEffects() {
  useEffect(
    () =>
      installScrollMotion({
        root: document.documentElement,
        preference: matchMedia("(prefers-reduced-motion: reduce)"),
        Observer: window.IntersectionObserver,
        query: (selector) => document.querySelectorAll(selector),
      }),
    [],
  );
  return null;
}
