"use client";

import { useEffect, useMemo, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import ParticlesBackground from "./components/ParticlesBackground";
import LoginCard from "./components/LoginCard";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [isItalian, setIsItalian] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
  }, [isDark]);

  const flagStyle = useMemo(() => {
    if (isItalian) {
      return {
        backgroundImage:
          "linear-gradient(90deg, #009246 0%, #009246 33%, #F4F5F0 33%, #F4F5F0 66%, #CE2B37 66%, #CE2B37 100%)",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }

    return {
      backgroundImage: [
        "linear-gradient(0deg, transparent 42%, #CF142B 42%, #CF142B 58%, transparent 58%)",
        "linear-gradient(90deg, transparent 42%, #CF142B 42%, #CF142B 58%, transparent 58%)",
        "linear-gradient(0deg, transparent 36%, #FFFFFF 36%, #FFFFFF 64%, transparent 64%)",
        "linear-gradient(90deg, transparent 36%, #FFFFFF 36%, #FFFFFF 64%, transparent 64%)",
        "linear-gradient(135deg, #00247D 0%, #00247D 100%)",
      ].join(","),
      backgroundSize: "100% 100%",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }, [isItalian]);

  const particleColors = useMemo(() => ["#8BFF00", "#FF00FF"], []);
  const backgroundHex = isDark ? "#000000" : "#FFFFFF";

  return (
    <ParticlesBackground
      particleCount={260}
      particleSpread={9}
      particleColors={particleColors}
      particleBaseSize={60}
      sizeRandomness={0.4}
      speed={0.25}
      moveParticlesOnHover
      particleHoverFactor={0.6}
      alphaParticles
      style={{ backgroundColor: backgroundHex }}
      backgroundColor={backgroundHex}
    >
      <div className="absolute top-4 right-4 z-20 flex gap-3">
        <button
          type="button"
          onClick={() => setIsDark((prev) => !prev)}
          aria-label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
          className="flex h-6 w-6 xl:h-12 xl:w-12 items-center justify-center rounded-full border-2 border-[rgba(var(--brand-green-rgb),0.25)] bg-[rgba(var(--brand-white-rgb),0.05)] text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-purple)] hover:text-[var(--brand-purple)]"
        >
          {isDark ? <FiSun size={14} /> : <FiMoon size={14} />}
        </button>
        <button
          type="button"
          onClick={() => setIsItalian((prev) => !prev)}
          aria-label={isItalian ? "Passa alla lingua inglese" : "Passa alla lingua italiana"}
          className="flex h-6 w-6 xl:h-12 xl:w-12 items-center justify-center rounded-full border-2 border-[rgba(var(--brand-green-rgb),0.25)] bg-center text-sm font-semibold text-[var(--foreground)] transition hover:scale-105"
          style={flagStyle}
        >
          {isItalian ? "IT" : "EN"}
        </button>
      </div>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <LoginCard />
      </div>
    </ParticlesBackground>
  );
}
