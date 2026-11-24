"use client";
import { useEffect } from "react";
import { installScrollMotion } from "@/lib/motion/scroll-motion";
export function MotionEffects() {
  useEffect(
    () => {
      // Touch devices use the static composition and avoid reveal observer work.
      if(matchMedia('(max-width: 760px), (pointer: coarse)').matches)return;
      return installScrollMotion({
        root: document.documentElement,
        preference: matchMedia("(prefers-reduced-motion: reduce)"),
        Observer: window.IntersectionObserver,
        query: (selector) => document.querySelectorAll(selector),
      });
    },
    [],
  );
  return null;
}
