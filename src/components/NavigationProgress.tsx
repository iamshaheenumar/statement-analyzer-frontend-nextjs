"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [width, setWidth] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (ticker.current) { clearInterval(ticker.current); ticker.current = null; }
  };

  const start = () => {
    clear();
    setOpacity(1);
    let w = 10;
    setWidth(w);
    ticker.current = setInterval(() => {
      w = Math.min(w + (Math.random() * 8 + 4), 85);
      setWidth(w);
      if (w >= 85) clear();
    }, 300);
  };

  const finish = () => {
    clear();
    setWidth(100);
    setTimeout(() => setOpacity(0), 200);
    setTimeout(() => setWidth(0), 450);
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (
        !href ||
        href === pathname ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:")
      ) return;
      start();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      finish();
    }
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[9999] h-[2px] bg-accent"
      style={{
        width: `${width}%`,
        opacity,
        transition: width === 0 ? "none" : "width 300ms ease-out, opacity 200ms ease-out",
      }}
    />
  );
}
