import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { UserStats } from '@/app/types';
import { useLanguage } from '@/app/components/LanguageProvider';

type FourthSceneProps = {
    stats: UserStats;
    isPaused: boolean;
};

const ANIMATION_DURATION = 4000;

const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "--";
    }
    const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
    return `${rounded}%`;
};

export const FourthScene: React.FC<FourthSceneProps> = ({ stats, isPaused }) => {
    const { t } = useLanguage();
    const [hoursCounter, setHoursCounter] = useState(0);
    const [rareRevealCount, setRareRevealCount] = useState(0);
    const [completedRevealCount, setCompletedRevealCount] = useState(0);
    const elapsedRef = useRef(0);
    const lastTimestampRef = useRef<number | null>(null);

    const recentHours = Math.max(0, Math.round(stats.steamRecentHours ?? 0));
    const rareAchievements = useMemo(() => {
        return [...(stats.steamRareAchievements ?? [])]
            .filter((item) => item?.name)
            .sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0))
            .slice(0, 3);
    }, [stats.steamRareAchievements]);
    const completedGames = useMemo(() => {
        return [...(stats.steamCompletedGames ?? [])]
            .filter((item) => item?.name)
            .sort((a, b) => (b.hours ?? 0) - (a.hours ?? 0))
            .slice(0, 3);
    }, [stats.steamCompletedGames]);

    useEffect(() => {
        elapsedRef.current = 0;
        lastTimestampRef.current = null;
        setHoursCounter(0);
        setRareRevealCount(0);
        setCompletedRevealCount(0);
    }, [recentHours, rareAchievements.length, completedGames.length]);

    useEffect(() => {
        if (isPaused) {
            lastTimestampRef.current = null;
            return;
        }

        let rafId = 0;
        const tick = (timestamp: number) => {
            if (lastTimestampRef.current === null) {
                lastTimestampRef.current = timestamp;
            }
            const delta = timestamp - lastTimestampRef.current;
            lastTimestampRef.current = timestamp;
            elapsedRef.current += delta;

            const progress = Math.min(elapsedRef.current / ANIMATION_DURATION, 1);
            setHoursCounter(Math.floor(recentHours * progress));
            setRareRevealCount(Math.min(rareAchievements.length, Math.floor(progress * rareAchievements.length)));
            setCompletedRevealCount(Math.min(completedGames.length, Math.floor(progress * completedGames.length)));

            if (progress >= 1) {
                setHoursCounter(recentHours);
                setRareRevealCount(rareAchievements.length);
                setCompletedRevealCount(completedGames.length);
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isPaused, recentHours, rareAchievements.length, completedGames.length]);

    return (
        <motion.div
            key="steam_highlights"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <div className="absolute inset-0 bg-[var(--background)]" />
            <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-8 px-6 text-center">
                <p className="text-base uppercase tracking-[0.4em] text-[var(--brand-purple)]">
                    {t('recap.steamHighlightsTitle')}
                </p>

                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-5 text-center">
                        <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                            {t('recap.recentHoursTitle')}
                        </p>
                        <p className="mt-3 text-4xl font-black text-[var(--brand-green)] tabular-nums">
                            {recentHours ? hoursCounter : 0}
                        </p>
                        <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-green)]">
                            {t('recap.hours')}
                        </p>
                    </div>

                    <div className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-5 text-left">
                        <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                            {t('recap.rareAchievementsTitle')}
                        </p>
                        <div className="mt-3 space-y-2">
                            {rareAchievements.length === 0 && (
                                <p className="text-sm text-[rgba(var(--foreground-rgb),0.6)]">
                                    {t('recap.noData')}
                                </p>
                            )}
                            {rareAchievements.map((achievement, index) => {
                                const isVisible = index < rareRevealCount;
                                return (
                                    <div
                                        key={`${achievement.game}-${achievement.name}-${index}`}
                                        className={`rounded-xl border border-[rgba(var(--brand-purple-rgb),0.3)] px-3 py-2 transition-all duration-500 ${
                                            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                                        }`}
                                    >
                                        <p className="text-[var(--foreground)] text-sm font-semibold">
                                            {achievement.name}
                                        </p>
                                        <p className="text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                                            {achievement.game} • {formatPercent(achievement.percent)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-5 text-left">
                        <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                            {t('recap.completedGamesTitle')}
                        </p>
                        <div className="mt-3 space-y-2">
                            {completedGames.length === 0 && (
                                <p className="text-sm text-[rgba(var(--foreground-rgb),0.6)]">
                                    {t('recap.noData')}
                                </p>
                            )}
                            {completedGames.map((game, index) => {
                                const isVisible = index < completedRevealCount;
                                return (
                                    <div
                                        key={`${game.appid}-${index}`}
                                        className={`rounded-xl border border-[rgba(var(--brand-purple-rgb),0.3)] px-3 py-2 transition-all duration-500 ${
                                            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                                        }`}
                                    >
                                        <p className="text-[var(--foreground)] text-sm font-semibold">
                                            {game.name}
                                        </p>
                                        <p className="text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                                            {t('recap.hoursPlayed', { hours: game.hours })}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
