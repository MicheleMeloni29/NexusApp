import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { UserStats } from '@/app/types';
import { useLanguage } from '@/app/components/LanguageProvider';

type FifthSceneProps = {
    stats: UserStats;
    isPaused: boolean;
};

type TrophyItem = {
    game: string;
    name: string;
    percent: number | null;
};

type TrophyTier = {
    id: 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common' | 'unknown';
    labelKey: string;
    maxPercent?: number;
};

const ANIMATION_DURATION = 2400;

const TROPHY_TIERS: TrophyTier[] = [
    { id: 'legendary', labelKey: 'recap.trophyTierLegendary', maxPercent: 1 },
    { id: 'epic', labelKey: 'recap.trophyTierEpic', maxPercent: 5 },
    { id: 'rare', labelKey: 'recap.trophyTierRare', maxPercent: 10 },
    { id: 'uncommon', labelKey: 'recap.trophyTierUncommon', maxPercent: 20 },
    { id: 'common', labelKey: 'recap.trophyTierCommon', maxPercent: 100 },
    { id: 'unknown', labelKey: 'recap.trophyTierUnknown' },
];

const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '--';
    }
    const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
    return `${rounded}%`;
};

export const FifthScene: React.FC<FifthSceneProps> = ({ stats, isPaused }) => {
    const { t } = useLanguage();
    const [visibleTiers, setVisibleTiers] = useState(0);
    const elapsedRef = useRef(0);
    const lastTimestampRef = useRef<number | null>(null);

    const trophies = useMemo<TrophyItem[]>(() => {
        const achievements = stats.steamAchievements?.length
            ? stats.steamAchievements
            : stats.steamRareAchievements ?? [];
        return [...achievements]
            .filter((item) => item?.name)
            .sort((a, b) => (a.percent ?? 100) - (b.percent ?? 100));
    }, [stats.steamAchievements, stats.steamRareAchievements]);

    const groupedTrophies = useMemo(() => {
        const grouped = TROPHY_TIERS.map((tier) => ({
            ...tier,
            trophies: [] as TrophyItem[],
        }));
        for (const trophy of trophies) {
            const percent = trophy.percent;
            if (percent === null || percent === undefined || Number.isNaN(percent)) {
                const unknownTier = grouped.find((item) => item.id === 'unknown');
                (unknownTier ?? grouped[grouped.length - 1]).trophies.push(trophy);
                continue;
            }
            const tier =
                grouped.find((item) => item.maxPercent !== undefined && percent <= item.maxPercent) ??
                grouped[grouped.length - 1];
            tier.trophies.push(trophy);
        }
        return grouped;
    }, [trophies]);

    const totalTrophies = trophies.length;

    useEffect(() => {
        elapsedRef.current = 0;
        lastTimestampRef.current = null;
        setVisibleTiers(0);
    }, [totalTrophies]);

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
            const tiersVisible = Math.ceil(progress * groupedTrophies.length);
            setVisibleTiers(tiersVisible);

            if (progress >= 1) {
                setVisibleTiers(groupedTrophies.length);
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [groupedTrophies.length, isPaused]);

    return (
        <motion.div
            key="steam_trophies"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <div className="absolute inset-0 bg-[var(--background)]" />
            <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-6 px-6 text-center">
                <p className="text-base uppercase tracking-[0.4em] text-[var(--brand-purple)]">
                    {t('recap.steamTrophiesTitle')}
                </p>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-green)]">
                    {t('recap.trophiesTotal', { count: totalTrophies })}
                </p>

                {totalTrophies === 0 ? (
                    <p className="text-sm text-[rgba(var(--foreground-rgb),0.6)]">
                        {t('recap.noData')}
                    </p>
                ) : (
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {groupedTrophies.map((tier, index) => {
                            const isVisible = index < visibleTiers;
                            const list = tier.trophies.slice(0, 3);
                            const remaining = tier.trophies.length - list.length;

                            return (
                                <div
                                    key={tier.id}
                                    className={`rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-4 text-left transition-all duration-500 ${
                                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                                            {t(tier.labelKey)}
                                        </p>
                                        <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-green)]">
                                            {tier.trophies.length} {t('recap.trophiesLabel')}
                                        </p>
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
