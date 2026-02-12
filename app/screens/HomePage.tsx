"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";
import ParticlesBackground from "@/app/components/UI/ParticlesBackground";
import FuzzyText from "@/app/components/UI/FuzzyText";
import Button from "@/app/components/UI/Button";
import { useLanguage } from "@/app/components/LanguageProvider";
import type { UserStats } from "@/app/types";
import { WrapStack } from "@/app/screens/WrapStack";
import PlayerCard from "@/app/screens/PlayerCard";
import { logoutAccount, type AuthUser } from "@/lib/api";

type HomePageProps = {
  stats: UserStats | null;
  onGenerate: () => void;
  user: AuthUser;
};

export default function HomePage({ stats, onGenerate, user }: HomePageProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isDark, setIsDark] = useState(true);
  const isItalian = language === "it";
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isWrapOpen, setIsWrapOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const hasStats = Boolean(stats);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountLabel = user?.email ?? t("common.accountDemo");
  const accountMenuLabel = t("common.account");
  const logoutLabel = t("common.logout");
  const emailLabel = t("common.email");
  const wrapMenuLabel = t("wrap.myWrap");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
  }, [isDark]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountMenuRef.current?.contains(target) || accountButtonRef.current?.contains(target)) {
        return;
      }
      setIsAccountMenuOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isAccountMenuOpen]);

  const particleColors = useMemo(() => ["#8BFF00", "#FF00FF"], []);
  const backgroundHex = isDark ? "#000000" : "#FFFFFF";

  const handleLogout = async () => {
    try {
      setIsAccountMenuOpen(false);
      await logoutAccount();
    } finally {
      window.location.href = "/";
    }
  };

  const openWrapStack = () => {
    setIsWrapOpen(true);
    setIsAccountMenuOpen(false);
  };

  return (
    <ParticlesBackground
      particleCount={600}
      particleSpread={8}
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
      <div className="absolute top-4 left-4 z-20">
        <div className="relative">
          <button
            type="button"
            ref={accountButtonRef}
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            aria-label={accountMenuLabel}
            aria-haspopup="dialog"
            aria-expanded={isAccountMenuOpen}
            className="flex h-8 w-8 md:h-10 md:w-10 xl:h-12 xl:w-12 items-center justify-center rounded-full border-1 border-[var(--brand-green)] bg-[rgba(var(--brand-white-rgb),0.05)] text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-green)] hover:text-[var(--brand-purple)]"
          >
            <FiMenu size={20} />
          </button>
          {isAccountMenuOpen ? (
            <div
              ref={accountMenuRef}
              role="dialog"
              aria-label={accountMenuLabel}
              className="absolute left-0 mt-3 w-64 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left text-[var(--card-foreground)] shadow-[0_20px_60px_rgba(var(--brand-black-rgb),0.35)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.6)]">
                {accountMenuLabel}
              </p>
              <div className="mt-3 space-y-2 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
                <p>
                  <span className="text-[rgba(var(--foreground-rgb),0.5)]">{emailLabel}:</span> {accountLabel}
                </p>
                {stats ? (
                  <button
                    type="button"
                    onClick={openWrapStack}
                    className="w-full rounded-xl border border-[rgba(var(--foreground-rgb),0.2)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[rgba(var(--foreground-rgb),0.75)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                  >
                    {wrapMenuLabel}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
              >
                {logoutLabel}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="absolute top-4 right-4 z-20 flex gap-3">
        <button
          type="button"
          onClick={() => setIsDark((prev) => !prev)}
          aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
          className="flex h-8 w-8 md:h-10 md:w-10 xl:h-12 xl:w-12 items-center justify-center rounded-full border-1 border-[var(--brand-green)] bg-[rgba(var(--brand-white-rgb),0.05)] text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-green)] hover:text-[var(--brand-purple)]"
        >
          {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
        <button
          type="button"
          onClick={() => setLanguage(isItalian ? "en" : "it")}
          aria-label={isItalian ? t("language.toEnglish") : t("language.toItalian")}
          className="flex h-8 w-8 md:h-10 md:w-10 xl:h-12 xl:w-12 items-center justify-center rounded-full border-1 border-[var(--brand-green)] text-xs xl:text-sm font-semibold uppercase text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-green)]"
        >
          {isItalian ? t("language.codeIt") : t("language.codeEn")}
        </button>
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16 text-[var(--foreground)]">
        <div className="w-full max-w-3xl space-y-10 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="inline-block">
                <FuzzyText
                  fontSize="clamp(2.4rem,5vw,3.2rem)"
                  color="#FF00FF"
                  baseIntensity={0.18}
                  hoverIntensity={0.31}
                >
                  {t("common.appName")}
                </FuzzyText>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.45em] text-[var(--brand-purple)]">
              {t("home.hubEyebrow")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Button
              onClick={() => setIsWrapOpen(true)}
              disabled={!hasStats}
              className="w-full"
              innerClassName="flex w-full flex-col items-center gap-4 rounded-2xl px-4 py-6 text-center"
            >
              <span className="text-base font-semibold uppercase tracking-[0.35em]">
                {t("home.optionWrapTitle")}
              </span>
              <span className="text-xs tracking-[0.2em]">
                {t("home.optionWrapSubtitle")}
              </span>
            </Button>
            <Button
              onClick={() => setIsPlayerOpen(true)}
              disabled={!hasStats}
              className="w-full"
              innerClassName="flex w-full flex-col items-center gap-4 rounded-2xl px-4 py-6 text-center"
            >
              <span className="text-base font-semibold uppercase tracking-[0.35em]">
                {t("home.optionCardTitle")}
              </span>
              <span className="text-xs tracking-[0.2em]">
                {t("home.optionCardSubtitle")}
              </span>
            </Button>
            <Button
              onClick={onGenerate}
              className="w-full"
              innerClassName="flex w-full flex-col items-center gap-4 rounded-2xl px-4 py-6 text-center"
            >
              <span className="text-base font-semibold uppercase tracking-[0.35em]">
                {t("home.optionGenerateTitle")}
              </span>
              <span className="text-xs tracking-[0.2em]">
                {t("home.optionGenerateSubtitle")}
              </span>
            </Button>
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
