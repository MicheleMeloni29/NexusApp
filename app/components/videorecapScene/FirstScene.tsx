import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { UserStats } from '@/app/types';
import { useLanguage } from '@/app/components/LanguageProvider';

type FirstSceneProps = {
    stats: UserStats;
    isPaused: boolean;
};

const COUNTER_DURATION = 1600;
const LEVEL_COUNTER_DURATION = 1200;

export const FirstScene: React.FC<FirstSceneProps> = ({ stats, isPaused }) => {
    const { t, language } = useLanguage();
    const [yearsCounter, setYearsCounter] = useState(0);
    const [levelCounter, setLevelCounter] = useState(0);
    const elapsedRef = useRef(0);
    const lastTimestampRef = useRef<number | null>(null);
    const levelElapsedRef = useRef(0);
    const levelLastTimestampRef = useRef<number | null>(null);

    const nickname = stats.steamPersonaName ?? t('recap.unknownPlayer');
    const avatarUrl = stats.steamAvatarUrl ?? '';
    const profileLevel = stats.steamProfileLevel;
    const targetLevel = useMemo(() => {
        if (profileLevel === null || profileLevel === undefined) return null;
        return Math.max(0, Math.round(profileLevel));
    }, [profileLevel]);
    const profileCreatedAt = useMemo(() => {
        if (!stats.steamProfileCreatedAt) return null;
        return new Date(stats.steamProfileCreatedAt * 1000);
    }, [stats.steamProfileCreatedAt]);
    const yearsActive = useMemo(() => {
        if (!profileCreatedAt) return 0;
        const now = new Date();
        let years = now.getFullYear() - profileCreatedAt.getFullYear();
        const isBeforeAnniversary =
            now.getMonth() < profileCreatedAt.getMonth() ||
            (now.getMonth() === profileCreatedAt.getMonth() && now.getDate() < profileCreatedAt.getDate());
        if (isBeforeAnniversary) {
            years -= 1;
        }
        return Math.max(0, years);
    }, [profileCreatedAt]);
    const createdAtLabel = useMemo(() => {
        if (!profileCreatedAt) return t('recap.unknownDate');
        const locale = language === 'it' ? 'it-IT' : 'en-US';
        return profileCreatedAt.toLocaleDateString(locale, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }, [language, profileCreatedAt, t]);

    useEffect(() => {
        elapsedRef.current = 0;
        lastTimestampRef.current = null;
        setYearsCounter(0);
    }, [profileCreatedAt, yearsActive]);

    useEffect(() => {
        levelElapsedRef.current = 0;
        levelLastTimestampRef.current = null;
        setLevelCounter(0);
    }, [targetLevel]);

    useEffect(() => {
        if (!profileCreatedAt) {
            setYearsCounter(0);
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

            const progress = Math.min(elapsedRef.current / COUNTER_DURATION, 1);
            setYearsCounter(Math.floor(yearsActive * progress));

            if (progress >= 1) {
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isPaused, profileCreatedAt, yearsActive]);

    useEffect(() => {
        if (targetLevel === null) {
            setLevelCounter(0);
            return;
        }
        if (isPaused) {
            levelLastTimestampRef.current = null;
            return;
        }

        let rafId = 0;
        const tick = (timestamp: number) => {
            if (levelLastTimestampRef.current === null) {
                levelLastTimestampRef.current = timestamp;
            }
            const delta = timestamp - levelLastTimestampRef.current;
            levelLastTimestampRef.current = timestamp;
            levelElapsedRef.current += delta;

            const progress = Math.min(levelElapsedRef.current / LEVEL_COUNTER_DURATION, 1);
            setLevelCounter(Math.floor(targetLevel * progress));

            if (progress >= 1) {
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isPaused, targetLevel]);

    return (
        <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <div className="absolute inset-0 bg-[var(--background)]" />
            <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="relative"
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={t('recap.avatarAlt', { name: nickname })}
                            className="h-28 w-28 md:h-36 md:w-36 rounded-full border-4 border-[var(--brand-purple)] object-cover shadow-[0_0_40px_rgba(var(--brand-purple-rgb),0.35)]"
                        />
                    ) : (
                        <div className="flex h-28 w-28 md:h-36 md:w-36 items-center justify-center rounded-full border-4 border-[var(--brand-purple)] bg-[rgba(var(--foreground-rgb),0.06)] text-4xl font-black text-[var(--foreground)] shadow-[0_0_40px_rgba(var(--brand-purple-rgb),0.35)]">
                            {nickname.charAt(0).toUpperCase() || 'N'}
                        </div>
                    )}
                </motion.div>
                <div className="space-y-6 text-center">
                    <p className="text-xs uppercase tracking-[0.4em] text-[rgba(var(--foreground-rgb),0.6)]">
                        {t('recap.introTitle')}
                    </p>
                    <div className="relative inline-block">
                        <span className="relative z-10 text-4xl md:text-6xl font-black tracking-tight text-[var(--foreground)]">
                            {nickname}
                        </span>
                        <span
                            aria-hidden="true"
                            className="glitch-layer glitch-layer-1 text-4xl md:text-6xl font-black tracking-tight text-[var(--brand-purple)]"
                        >
                            {nickname}
                        </span>
                        {/* ACCOUNT USERNAME */}
                        <span
                            aria-hidden="true"
                            className="glitch-layer glitch-layer-2 text-4xl md:text-6xl font-black tracking-tight text-[var(--brand-green)]"
                        >
                            {nickname}
                        </span>
                    </div>
                    {/* SEZIONE INFO ACCOUNT */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        {/* LIVELLO PROFILO */}
                        <div className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-4">
                            <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                                {t('recap.profileLevel')}
                            </p>
                            <p className="mt-2 text-2xl font-bold text-[var(--brand-green)] tabular-nums">
                                {targetLevel === null ? '--' : levelCounter}
                            </p>
                        </div>
                        {/* DATA CREAZIONE ACCOUNT */}
                        <div className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-4">
                            <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                                {t('recap.profileCreated')}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[var(--brand-green)]">
                                {createdAtLabel}
                            </p>
                        </div>
                        {/* ANNI DI ATTIVITA' */}
                        <div className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-4">
                            <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                                {t('recap.yearsActive')}
                            </p>
                            <p className="mt-2 text-2xl font-bold text-[var(--brand-green)] tabular-nums">
                                {profileCreatedAt ? yearsCounter : '--'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
