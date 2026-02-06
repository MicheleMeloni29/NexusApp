import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { UserStats } from '@/app/types';
import { useLanguage } from '@/app/components/LanguageProvider';

type FirstSceneProps = {
    stats: UserStats;
    isPaused: boolean;
    finalState?: boolean;
};

const COUNTER_STEP_DURATION = 1500;
const TOTAL_SEQUENCE_DURATION = COUNTER_STEP_DURATION * 3;

// EFFETTO ROLLING SUI NUMERI DI ANNI DI ATTIVITA' E LIVELLO PROFILO
type RollingNumberProps = {
    value: number;
    max: number;
    className?: string;
};

const RollingNumber: React.FC<RollingNumberProps> = ({ value, max, className }) => {
    const numbers = useMemo(() => Array.from({ length: max + 1 }, (_, i) => i), [max]);
    const clampedValue = Math.min(Math.max(value, 0), max);
    return (
        <div className={`relative h-[1em] overflow-hidden ${className ?? ''}`}>
            <div
                className="flex flex-col leading-none"
                style={{ transform: `translateY(-${clampedValue}em)` }}
            >
                {numbers.map((num) => (
                    <span key={num} className="h-[1em] leading-none">
                        {num}
                    </span>
                ))}
            </div>
        </div>
    );
};

// ROLLING PER LA DATA CREAZIONE PROFILO
type RollingTextProps = {
    items: string[];
    index: number;
    className?: string;
}
const RollingText: React.FC<RollingTextProps> = ({ items, index, className }) => {
    const clamped = Math.min(Math.max(index, 0), items.length - 1);
    return (
        <div className={`relative h-[1em] overflow-hidden ${className ?? ""}`}>
            <div
                className="flex flex-col leading-none transition-transform duration-200"
                style={{ transform: `translateY(-${clamped}em)` }}
            >
                {items.map((item) => (
                    <span key={item} className="h-[1em] leading-none">
                        {item}
                    </span>
                ))}
            </div>
        </div>     
    );
};

export const FirstScene: React.FC<FirstSceneProps> = ({ stats, isPaused, finalState = false }) => {
    const { t, language } = useLanguage();
    const [yearsCounter, setYearsCounter] = useState(0);
    const [levelCounter, setLevelCounter] = useState(0);
    const elapsedRef = useRef(0);
    const lastTimestampRef = useRef<number | null>(null);

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

    // COSTANTI PER L'ANIMAZIONE ROLLINGTEXT, MOSTRA LA DATA DI CREAZIONE DEL PROFILO
    const days = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")), []);
    const months = useMemo(() => ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], []);
    const years = useMemo(() => {
        const start = 2004;     // ANNO CREAZIONE STEAM
        const end = new Date().getFullYear();
        return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
    }, []);

    // CALCOLO INDICI TARGET DELLA DATA REALE
    const dayIndex = profileCreatedAt ? profileCreatedAt.getDate() - 1 : 0;
    const monthIndex = profileCreatedAt ? profileCreatedAt.getMonth() : 0;
    const yearIndex = profileCreatedAt ? Math.max(0, profileCreatedAt.getFullYear() - 2004) : 0;

    // ANIMO GLI INDICI CON LO STESSO TIMER (USO GLI STESSI PROGRESS DEI COUNTER)
    const [dateProgress, setDateProgress] = useState(0);

    // CALCOLO GLI INDICI "ROLLING" CON PROGRESS
    const dayRollingIndex = Math.floor(dayIndex * dateProgress);
    const monthRollingIndex = Math.floor(monthIndex * dateProgress);
    const yearRollingIndex = Math.floor(yearIndex * dateProgress);
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
    
    // 
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
        if (finalState) {
            setYearsCounter(profileCreatedAt ? yearsActive : 0);
            setLevelCounter(targetLevel ?? 0);
            setDateProgress(profileCreatedAt ? 1 : 0);
            return;
        }
        setYearsCounter(0);
        setLevelCounter(0);
        setDateProgress(0);
    }, [finalState, profileCreatedAt, yearsActive, targetLevel]);

    useEffect(() => {
        if (finalState) {
            return;
        }
        if (!profileCreatedAt && targetLevel === null) {
            setYearsCounter(0);
            setLevelCounter(0);
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

            const elapsed = Math.min(elapsedRef.current, TOTAL_SEQUENCE_DURATION);
            const levelProgress = targetLevel !== null
                ? Math.min(elapsed / COUNTER_STEP_DURATION, 1)
                : 0;
            const dateProg = profileCreatedAt
                ? Math.min(Math.max((elapsed - COUNTER_STEP_DURATION) / COUNTER_STEP_DURATION, 0), 1)
                : 0;
            const yearsProgress = profileCreatedAt
                ? Math.min(Math.max((elapsed - COUNTER_STEP_DURATION * 2) / COUNTER_STEP_DURATION, 0), 1)
                : 0;

            if (targetLevel !== null) {
                setLevelCounter(targetLevel * levelProgress);
            }
            setDateProgress(dateProg);
            if (profileCreatedAt) {
                setYearsCounter(yearsActive * yearsProgress);
            }

            if (elapsed >= TOTAL_SEQUENCE_DURATION) {
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [finalState, isPaused, profileCreatedAt, targetLevel, yearsActive]);

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
                <p className="text-base uppercase tracking-[0.4em] text-[var(--brand-purple)]">
                    {t('recap.introTitle')}
                </p>
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
                            <div className="mt-2 text-2xl font-bold text-[var(--brand-green)] tabular-nums">
                                {targetLevel === null ? (
                                    '--'
                                ) : (
                                    <RollingNumber value={levelCounter} max={targetLevel} />
                                )}
                            </div>
                        </div>
                        {/* DATA CREAZIONE ACCOUNT */}
                        <div className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-4">
                            <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                                {t('recap.profileCreated')}
                            </p>
                            <div className="mt-2 text-lg font-semibold text-[var(--brand-green)] flex items-center justify-center gap-2">
                                <RollingText items={days} index={dayRollingIndex} />
                                <RollingText items={months} index={monthRollingIndex} />
                                <RollingText items={years} index={yearRollingIndex} />
                            </div>
                        </div>
                        {/* ANNI DI ATTIVITA' */}
                        <div className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-4">
                            <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                                {t('recap.yearsActive')}
                            </p>
                            <div className="mt-2 text-2xl font-bold text-[var(--brand-green)] tabular-nums">
                                {profileCreatedAt ? (
                                    <RollingNumber value={yearsCounter} max={yearsActive} />
                                ) : (
                                    '--'
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
