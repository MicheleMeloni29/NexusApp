"use client";

import { useEffect, useMemo, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import ParticlesBackground from "./components/ParticlesBackground";
import LoginCard from "./components/LoginCard";
import { VideoRecap } from "./components/VideoRecap";
import type { UserStats } from "@/app/types";
import FuzzyText from "@/components/FuzzyText";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [isItalian, setIsItalian] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [recapStats, setRecapStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
  }, [isDark]);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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
          className="flex h-6 w-6 xl:h-12 xl:w-12 items-center justify-center rounded-full border-2 border-[rgba(var(--brand-green-rgb),0.25)] text-xs xl:text-sm font-semibold uppercase text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-purple)]"
        >
          {isItalian ? "IT" : "EN"}
        </button>
      </div>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        {showIntro && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-center pointer-events-none">
            <FuzzyText fontSize="clamp(2.5rem,8vw,5rem)" color="#FF00FF" baseIntensity={0.2} hoverIntensity={0.35}>
              NEXUSAPP
            </FuzzyText>
            <FuzzyText fontSize="clamp(1.4rem,6vw,3.5rem)" color="#FF00FF" baseIntensity={0.14} hoverIntensity={0.24}>
              YOUR GAME LEGACY
            </FuzzyText>
          </div>
        )}
        {!showIntro && <LoginCard onRecapReady={setRecapStats} />}
      </div>
      {recapStats && <VideoRecap stats={recapStats} onComplete={() => setRecapStats(null)} />}
    </ParticlesBackground>
  );
}
