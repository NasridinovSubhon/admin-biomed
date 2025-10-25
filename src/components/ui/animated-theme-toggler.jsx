"use client";

import { Moon, SunDim } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";

export const AnimatedThemeToggler = ({ className, onClick }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const buttonRef = useRef(null);


  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  }, []);

  const changeTheme = async () => {
    if (!buttonRef.current) return;

    await document.startViewTransition(() => {
      flushSync(() => {
        const dark = document.documentElement.classList.toggle("dark");
        setIsDarkMode(dark);
        localStorage.setItem("theme", dark ? "dark" : "light");
      });
    }).ready;

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
    const y = top + height / 2;
    const x = left + width / 2;

    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRad}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );


    if (onClick) onClick();
  };

  return (
    <button
      ref={buttonRef}
      onClick={changeTheme}
      className={cn(
        "p-2 rounded-full cursor-pointer text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
        className
      )}
    >
      {isDarkMode ? <SunDim /> : <Moon />}
    </button>
  );
};
