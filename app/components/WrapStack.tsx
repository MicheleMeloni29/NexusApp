"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import type { UserStats } from "@/app/types";
import GradientText from "./UI/GradientText";
import { useLanguage } from "@/app/components/LanguageProvider";
import { FirstScene } from "@/app/components/videorecapScene/FirstScene";
import { SecondScene } from "@/app/components/videorecapScene/SecondScene";
import { ThirdScene } from "@/app/components/videorecapScene/ThirdScene";
import { FourthScene } from "@/app/components/videorecapScene/FourthScene";
import { FifthScene } from "@/app/components/videorecapScene/FifthScene";

type WrapStackProps = {
  stats: UserStats;
  onClose: () => void;
};

export function WrapStack({ stats, onClose }: WrapStackProps) {
  const { t } = useLanguage();
  const closeLabel = t("wrap.close");
  const [activeIndex, setActiveIndex] = useState(0);

  const scenes = useMemo(
    () => [
      { id: "intro", label: t("recap.introTitle"), Component: FirstScene },
      { id: "total_time", label: t("recap.totalGamingTimeTitle"), Component: SecondScene },
      { id: "top_genres", label: t("recap.topGenresTitle"), Component: ThirdScene },
      { id: "top_games", label: t("recap.topGamesTitle"), Component: FourthScene },
      { id: "steam_trophies", label: t("recap.steamTrophiesTitle"), Component: FifthScene },
    ],
    [t]
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, scenes.length]);

  const activeScene = scenes[activeIndex];
  const ActiveSceneComponent = activeScene?.Component ?? FirstScene;
  const scrollLockRef = useRef(false);
  const scrollAccumulatorRef = useRef(0);
  const unlockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const lockScroll = () => {
      scrollLockRef.current = true;
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
      }
      unlockTimerRef.current = window.setTimeout(() => {
        scrollLockRef.current = false;
        unlockTimerRef.current = null;
      }, 700);
    };

    const handleWheel = (event: WheelEvent) => {
      if (scrollLockRef.current) {
        event.preventDefault();
        lockScroll();
        return;
      }
      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (delta === 0) return;
      scrollAccumulatorRef.current += delta;
      if (Math.abs(scrollAccumulatorRef.current) < 20) return;
      event.preventDefault();
      lockScroll();
      setActiveIndex((prev) => {
        const next = scrollAccumulatorRef.current > 0 ? prev + 1 : prev - 1;
        return Math.max(0, Math.min(scenes.length - 1, next));
      });
      scrollAccumulatorRef.current = 0;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
      }
    };
  }, [scenes.length]);

  return (
    <div className="fixed inset-0 z-40 bg-[var(--background)]">
      <div className="relative h-full w-full overflow-hidden">
        <ActiveSceneComponent key={activeScene?.id} stats={stats} isPaused finalState />
      </div>

      <div className="absolute right-4 top-4 z-30">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(var(--foreground-rgb),0.2)] bg-[rgba(var(--brand-black-rgb),0.35)] text-[var(--foreground)] backdrop-blur transition hover:scale-105 hover:border-[var(--brand-green)] hover:text-[var(--brand-purple)]"
        >
          <FiX size={18} />
        </button>
      </div>

      <GradientText
        animationSpeed={3}
        showBorder={false}
        className="absolute bottom-22 z-30 text-[12px] uppercase tracking-[0.35em] pointer-events-none"
      >
        {t("wrap.gradientText")}
      </GradientText>

      <div className="absolute bottom-8 left-8 right-8 z-30">
        <div className="flex items-center gap-2">
          {scenes.map((scene, index) => {
            const isCurrent = index === activeIndex;
            return (
              <div
                key={scene.id}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(var(--foreground-rgb),0.2)]"
              >
                {isCurrent ? (
                  <div
                    className="h-full w-full bg-[var(--brand-purple)] shadow-[0_0_14px_rgba(var(--brand-purple-rgb),0.6)]"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
