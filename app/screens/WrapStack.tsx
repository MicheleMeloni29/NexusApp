"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import type { UserStats } from "@/app/types";
import GradientText from "@/app/components/UI/GradientText";
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
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchLastRef = useRef<{ x: number; y: number } | null>(null);

  const lockScroll = useCallback(() => {
    scrollLockRef.current = true;
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
    }
    unlockTimerRef.current = window.setTimeout(() => {
      scrollLockRef.current = false;
      unlockTimerRef.current = null;
    }, 700);
  }, []);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (scrollLockRef.current) {
        event.preventDefault();
        lockScroll();
        return;
      }
      let delta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : 0;
      if (delta === 0 && event.shiftKey) {
        delta = event.deltaY;
      }
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
  }, [lockScroll, scenes.length]);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchLastRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = event.touches[0];
    touchLastRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    const start = touchStartRef.current;
    const last = touchLastRef.current;
    touchStartRef.current = null;
    touchLastRef.current = null;
    if (!start || !last) return;
    if (scrollLockRef.current) return;
    const deltaX = last.x - start.x;
    const deltaY = last.y - start.y;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }
    lockScroll();
    setActiveIndex((prev) => {
      const next = deltaX < 0 ? prev + 1 : prev - 1;
      return Math.max(0, Math.min(scenes.length - 1, next));
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-[var(--background)] touch-none overscroll-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
