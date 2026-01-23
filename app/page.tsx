"use client";

import { useEffect, useMemo, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import ParticlesBackground from "./components/ParticlesBackground";
import LoginCard from "./components/LoginCard";
import FuzzyText from "@/components/FuzzyText";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [isDark, setIsDark] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const isItalian = language === "it";

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
          aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
          className="flex h-8 w-8 xl:h-16 xl:w-16 items-center justify-center rounded-full border-2 border-[var(--brand-green)] bg-[rgba(var(--brand-white-rgb),0.05)] text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-green)] hover:text-[var(--brand-purple)]"
        >
          {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
        <button
          type="button"
          onClick={() => setLanguage(isItalian ? "en" : "it")}
          aria-label={isItalian ? t("language.toEnglish") : t("language.toItalian")}
          className="flex h-8 w-8 xl:h-16 xl:w-16 items-center justify-center rounded-full border-2 border-[var(--brand-green)] text-xs xl:text-sm font-semibold uppercase text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-green)]"
        >
          {isItalian ? t("language.codeIt") : t("language.codeEn")}
        </button>
      </div>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        {showIntro && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-center pointer-events-none">
            <FuzzyText fontSize="clamp(2.5rem,8vw,5rem)" color="#FF00FF" baseIntensity={0.2} hoverIntensity={0.35}>
              {t("homeIntro.title")}
            </FuzzyText>
            <FuzzyText fontSize="clamp(1.4rem,6vw,3.5rem)" color="#FF00FF" baseIntensity={0.14} hoverIntensity={0.24}>
              {t("homeIntro.subtitle")}
            </FuzzyText>
          </div>
        )}
        {!showIntro && <LoginCard />}
      </div>
    </ParticlesBackground>
  );
}
