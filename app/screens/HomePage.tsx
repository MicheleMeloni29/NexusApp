"use client";

import { useMemo, useState, useEffect } from "react";
import { FiMoon, FiSun, FiX } from "react-icons/fi";
import ParticlesBackground from "@/app/components/UI/ParticlesBackground";
import { useLanguage } from "@/app/components/LanguageProvider";
import type { UserStats } from "@/app/types";
import { WrapStack } from "@/app/screens/WrapStack";
import PlayerCard from "@/app/screens/PlayerCard";

type HomePageProps = {
  stats: UserStats | null;
  onGenerate: () => void;
};

export default function HomePage({ stats, onGenerate }: HomePageProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isDark, setIsDark] = useState(true);
  const isItalian = language === "it";
  const [isWrapOpen, setIsWrapOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const hasStats = Boolean(stats);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
  }, [isDark]);

  const particleColors = useMemo(() => ["#8BFF00", "#FF00FF"], []);
  const backgroundHex = isDark ? "#000000" : "#FFFFFF";

  return (
    <ParticlesBackground
      particleCount={400}
      particleSpread={9}
      particleColors={particleColors}
      particleBaseSize={60}
      sizeRandomness={0.4}
      speed={0.2}
      moveParticlesOnHover
      particleHoverFactor={0.5}
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

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16 text-[var(--foreground)]">
        <div className="w-full max-w-3xl space-y-10 text-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.45em] text-[var(--brand-purple)]">
              {t("home.hubEyebrow")}
            </p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">
              {t("home.hubTitle")}
            </h1>
            <p className="text-sm text-[rgba(var(--foreground-rgb),0.7)]">
              {t("home.hubSubtitle")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setIsWrapOpen(true)}
              disabled={!hasStats}
              className="group rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-[rgba(var(--foreground-rgb),0.04)] px-4 py-6 text-left transition hover:-translate-y-1 hover:border-[var(--brand-green)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--brand-purple)]">
                {t("home.optionWrapTitle")}
              </p>
              <p className="mt-3 text-base font-semibold">{t("home.optionWrapSubtitle")}</p>
            </button>
            <button
              type="button"
              onClick={() => setIsPlayerOpen(true)}
              disabled={!hasStats}
              className="group rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-[rgba(var(--foreground-rgb),0.04)] px-4 py-6 text-left transition hover:-translate-y-1 hover:border-[var(--brand-green)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--brand-purple)]">
                {t("home.optionCardTitle")}
              </p>
              <p className="mt-3 text-base font-semibold">{t("home.optionCardSubtitle")}</p>
            </button>
            <button
              type="button"
              onClick={onGenerate}
              className="group rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-[var(--brand-green)] px-4 py-6 text-left text-[var(--brand-black)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(var(--brand-green-rgb),0.25)]"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--brand-black)]">
                {t("home.optionGenerateTitle")}
              </p>
              <p className="mt-3 text-base font-semibold">{t("home.optionGenerateSubtitle")}</p>
            </button>
          </div>

          {!hasStats ? (
            <p className="text-xs text-[rgba(var(--foreground-rgb),0.6)]">
              {t("home.noWrapYet")}
            </p>
          ) : null}
        </div>
      </main>

      {stats && isWrapOpen ? (
        <WrapStack stats={stats} onClose={() => setIsWrapOpen(false)} />
      ) : null}

      {stats && isPlayerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[rgba(0,0,0,0.7)] px-4 py-10">
          <div className="relative w-full max-w-6xl">
            <button
              type="button"
              onClick={() => setIsPlayerOpen(false)}
              aria-label={t("playerCard.close")}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(var(--foreground-rgb),0.2)] bg-[rgba(var(--brand-black-rgb),0.35)] text-[var(--foreground)] backdrop-blur transition hover:scale-105 hover:border-[var(--brand-green)] hover:text-[var(--brand-purple)]"
            >
              <FiX size={18} />
            </button>
            <PlayerCard stats={stats} />
          </div>
        </div>
      ) : null}
    </ParticlesBackground>
  );
}
