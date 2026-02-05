import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { UserStats } from '@/app/types';
import { useLanguage } from '@/app/components/LanguageProvider';

type FourthSceneProps = {
    stats: UserStats;
    isPaused: boolean;
};

const ANIMATION_DURATION = 4000;
const STEAM_COVER_BASE = "https://cdn.cloudflare.steamstatic.com/steam/apps";

const buildSteamCoverUrl = (appid?: number | null) => {
    if (!appid) return null;
    return `${STEAM_COVER_BASE}/${appid}/header.jpg`;
};

export const FourthScene: React.FC<FourthSceneProps> = ({ stats, isPaused }) => {
    const { t } = useLanguage();
    const [revealCount, setRevealCount] = useState(0);
    const elapsedRef = useRef(0);
    const lastTimestampRef = useRef<number | null>(null);

    const topGames = useMemo(() => {
        const games = stats.steamTopGames ?? [];
        return [...games]
            .filter((game) => game?.name)
            .sort((a, b) => (b.hours ?? 0) - (a.hours ?? 0))
            .slice(0, 5);
    }, [stats.steamTopGames]);

    useEffect(() => {
        elapsedRef.current = 0;
        lastTimestampRef.current = null;
        setRevealCount(0);
    }, [topGames.length]);

    useEffect(() => {
        if (!topGames.length) {
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
            const count = Math.min(topGames.length, Math.floor(progress * topGames.length));
            setRevealCount(count);

            if (progress >= 1) {
                setRevealCount(topGames.length);
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isPaused, topGames.length]);

    return (
        <motion.div
            key="top_games"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <div className="absolute inset-0 bg-[var(--background)]" />
            <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 px-6 text-center">
                <p className="text-base uppercase tracking-[0.4em] text-[var(--brand-purple)]">
                    {t('recap.topGamesTitle')}
                </p>
                <div className="w-full max-w-xl space-y-3">
                    {topGames.map((game, index) => {
                        const isVisible = index >= topGames.length - revealCount;
                        const coverUrl = buildSteamCoverUrl(game.appid);
                        return (
                            <div
                                key={`${game.name}-${index}`}
                                className={`flex items-center justify-between rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] px-4 py-3 text-left transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-sm uppercase tracking-[0.25em] text-[var(--brand-purple)]">
                                        #{index + 1}
                                    </div>
                                    {coverUrl ? (
                                        <img
                                            src={coverUrl}
                                            alt={game.name}
                                            loading="lazy"
                                            className="h-10 w-18 rounded-lg border border-[rgba(var(--foreground-rgb),0.2)] object-cover"
                                        />
                                    ) : (
                                        <div className="h-10 w-[72px] rounded-lg border border-[rgba(var(--foreground-rgb),0.2)] bg-[rgba(var(--foreground-rgb),0.05)]" />
                                    )}
                                </div>
                                <div className="flex-1 px-4 text-[var(--foreground)] font-semibold">
                                    {game.name}
                                </div>
                                <div className="text-[var(--brand-green)] font-semibold tabular-nums">
                                    {t('recap.hoursPlayed', { hours: game.hours })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};
