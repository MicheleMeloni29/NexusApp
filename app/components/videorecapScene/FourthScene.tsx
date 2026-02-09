import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { UserStats } from '@/app/types';
import { useLanguage } from '@/app/components/LanguageProvider';
import { SceneBackground } from '@/app/components/wrapBackgrounds/SceneBackground';

type FourthSceneProps = {
    stats: UserStats;
    isPaused: boolean;
    finalState?: boolean;
};

const ITEM_ANIMATION_DURATION = 1400;
const STEAM_COVER_BASE = "https://cdn.cloudflare.steamstatic.com/steam/apps";

const buildSteamCoverUrl = (appid?: number | null) => {
    if (!appid) return null;
    return `${STEAM_COVER_BASE}/${appid}/header.jpg`;
};

export const FourthScene: React.FC<FourthSceneProps> = ({ stats, isPaused, finalState = false }) => {
    const { t } = useLanguage();
    const [revealCount, setRevealCount] = useState(0);

    const topGames = useMemo(() => {
        const games = stats.steamTopGames ?? [];
        return [...games]
            .filter((game) => game?.name)
            .sort((a, b) => (b.hours ?? 0) - (a.hours ?? 0))
            .slice(0, 5);
    }, [stats.steamTopGames]);

    useEffect(() => {
        if (finalState) {
            setRevealCount(topGames.length);
            return;
        }
        setRevealCount(0);
    }, [finalState, topGames.length]);

    useEffect(() => {
        if (finalState) return;
        if (isPaused) return;
        if (!topGames.length) {
            setRevealCount(0);
            return;
        }
        setRevealCount((count) => (count === 0 ? 1 : count));
    }, [finalState, isPaused, topGames.length]);

    const handleRowComplete = (index: number) => {
        if (finalState || isPaused) return;
        setRevealCount((count) => {
            const currentIndex = topGames.length - count;
            if (index !== currentIndex) return count;
            return Math.min(topGames.length, count + 1);
        });
    };

    return (
        <motion.div
            key="top_games"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <SceneBackground sceneId="top_games" isPaused={isPaused} finalState={finalState} />
            <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 px-6 text-center">
                <p className="text-base uppercase tracking-[0.4em] text-[var(--brand-purple)]">
                    {t('recap.topGamesTitle')}
                </p>
                <div className="w-full max-w-xl space-y-3">
                    {topGames.map((game, index) => {
                        const isVisible = index >= topGames.length - revealCount;
                        const isCurrent = isVisible && index === topGames.length - revealCount;
                        return (
                            <GameRow
                                key={`${game.name}-${index}`}
                                game={game}
                                index={index}
                                isVisible={isVisible}
                                isCurrent={isCurrent}
                                isPaused={isPaused}
                                finalState={finalState}
                                onComplete={() => handleRowComplete(index)}
                            />
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

const formatHours = (value: number) => {
    if (Number.isNaN(value)) return 0;
    return Number.isInteger(value) ? value : Number(value.toFixed(1));
};

const useAnimatedNumber = (
    target: number,
    isActive: boolean,
    isPaused: boolean,
    finalState: boolean
) => {
    const [value, setValue] = useState(finalState ? target : 0);
    const valueRef = useRef(value);
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const startValueRef = useRef(0);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        if (finalState) {
            setValue(target);
            return;
        }

        if (!isActive) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            startTimeRef.current = null;
            startValueRef.current = 0;
            setValue(0);
            return;
        }

        if (isPaused) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            startTimeRef.current = null;
            return;
        }

        startValueRef.current = valueRef.current;
        const tick = (timestamp: number) => {
            if (startTimeRef.current === null) {
                startTimeRef.current = timestamp;
            }
            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / ITEM_ANIMATION_DURATION, 1);
            const nextValue = startValueRef.current + (target - startValueRef.current) * progress;

            if (progress >= 1 || Math.abs(nextValue - valueRef.current) > 0.05) {
                setValue(nextValue);
            }

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [finalState, isActive, isPaused, target]);

    return value;
};

type GameRowProps = {
    game: { name: string; hours?: number; appid?: number | null };
    index: number;
    isVisible: boolean;
    isCurrent: boolean;
    isPaused: boolean;
    finalState: boolean;
    onComplete: () => void;
};

const GameRow: React.FC<GameRowProps> = ({
    game,
    index,
    isVisible,
    isCurrent,
    isPaused,
    finalState,
    onComplete,
}) => {
    const { t } = useLanguage();
    const coverUrl = buildSteamCoverUrl(game.appid);
    const targetHours = Math.max(0, game.hours ?? 0);
    const animatedHours = useAnimatedNumber(targetHours, isVisible, isPaused, finalState);
    const hasCompletedRef = useRef(false);

    useEffect(() => {
        if (!isCurrent) {
            hasCompletedRef.current = false;
        }
    }, [isCurrent, targetHours]);

    useEffect(() => {
        if (!isCurrent || isPaused || finalState) return;
        if (hasCompletedRef.current) return;
        if (animatedHours >= targetHours - 0.05) {
            hasCompletedRef.current = true;
            onComplete();
        }
    }, [animatedHours, isCurrent, isPaused, finalState, onComplete, targetHours]);

    return (
        <motion.div
            initial={false}
            animate={isVisible ? "visible" : "hidden"}
            variants={{
                hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex h-20 items-center justify-between rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] px-4 py-3 text-left"
        >
            <div className="flex items-center gap-1">
                <div className="w-7 text-sm uppercase tracking-[0.25em] text-[var(--brand-purple)]">
                    #{index + 1}
                </div>
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={game.name}
                        loading="lazy"
                        className="h-12 w-20 rounded-lg border border-[rgba(var(--foreground-rgb),0.2)] object-cover"
                    />
                ) : (
                    <div className="h-12 w-20 rounded-lg border border-[rgba(var(--foreground-rgb),0.2)] bg-[rgba(var(--foreground-rgb),0.05)]" />
                )}
            </div>
            <div className="flex-1 px-4 text-[var(--foreground)] font-semibold leading-tight line-clamp-2">
                {game.name}
            </div>
            <div className="min-w-[88px] text-right text-[var(--brand-green)] font-semibold tabular-nums">
                {t('recap.hoursPlayed', { hours: formatHours(animatedHours) })}
            </div>
        </motion.div>
    );
};
