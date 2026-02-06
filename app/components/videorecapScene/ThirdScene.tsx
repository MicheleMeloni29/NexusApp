import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { UserStats } from '@/app/types';
import { useLanguage } from '@/app/components/LanguageProvider';

type ThirdSceneProps = {
    stats: UserStats;
    isPaused: boolean;
    finalState?: boolean;
};

const ANIMATION_DURATION = 2400;

export const ThirdScene: React.FC<ThirdSceneProps> = ({ stats, isPaused, finalState = false }) => {
    const { t } = useLanguage();
    const [revealCount, setRevealCount] = useState(0);
    const elapsedRef = useRef(0);
    const lastTimestampRef = useRef<number | null>(null);

    const topGenres = useMemo(() => {
        const list = stats.steamTopGenres ?? [];
        return [...list]
            .filter((genre) => genre?.name)
            .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
            .slice(0, 3);
    }, [stats.steamTopGenres]);

    const displayGenres = useMemo(() => {
        if (!topGenres.length) return [];
        const total = topGenres.reduce((acc, genre) => acc + (genre.percent ?? 0), 0);
        const remaining = Math.max(0, Number((100 - total).toFixed(1)));
        return [...topGenres, { name: t('recap.topGenresOther'), percent: remaining }];
    }, [topGenres, t]);

    const formatPercent = (value: number) => {
        if (Number.isNaN(value)) return "0%";
        return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
    };

    useEffect(() => {
        elapsedRef.current = 0;
        lastTimestampRef.current = null;
        if (finalState) {
            setRevealCount(displayGenres.length);
            return;
        }
        setRevealCount(0);
    }, [displayGenres.length, finalState]);

    useEffect(() => {
        if (finalState) {
            return;
        }
        if (!displayGenres.length) {
            setRevealCount(0);
            return;
        }
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
            const count = Math.min(displayGenres.length, Math.ceil(progress * displayGenres.length));
            setRevealCount(count);

            if (progress >= 1) {
                setRevealCount(displayGenres.length);
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [finalState, isPaused, displayGenres.length]);

    return (
        <motion.div
            key="top_genres"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <div className="absolute inset-0 bg-[var(--background)]" />
            <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 px-6 text-center">
                <div className="space-y-2">
                    <p className="text-base uppercase tracking-[0.4em] text-[var(--brand-purple)]">
                        {t('recap.topGenresTitle')}
                    </p>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-green)]">
                        {t('recap.topGenresSubtitle')}
                    </p>
                </div>

                {displayGenres.length === 0 ? (
                    <p className="text-sm text-[rgba(var(--foreground-rgb),0.6)]">
                        {t('recap.noData')}
                    </p>
                ) : (
                    <div className="w-full max-w-xl space-y-4">
                        {displayGenres.map((genre, index) => {
                            const isVisible = index < revealCount;
                            const width = Math.min(100, Math.max(0, genre.percent ?? 0));
                            return (
                                <div
                                    key={`${genre.name}-${index}`}
                                    className={`rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-4 text-left transition-all duration-500 ${
                                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm uppercase tracking-[0.25em] text-[var(--brand-purple)]">
                                                #{index + 1}
                                            </span>
                                            <span className="text-lg font-semibold text-[var(--foreground)]">
                                                {genre.name}
                                            </span>
                                        </div>
                                        <span className="text-[var(--brand-green)] font-semibold tabular-nums">
                                            {formatPercent(genre.percent ?? 0)}
                                        </span>
                                    </div>
                                    <div className="mt-3 h-2 rounded-full bg-[rgba(var(--foreground-rgb),0.15)]">
                                        <div
                                            className="h-full rounded-full bg-[var(--brand-purple)] shadow-[0_0_14px_rgba(var(--brand-purple-rgb),0.45)] transition-all duration-700"
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
