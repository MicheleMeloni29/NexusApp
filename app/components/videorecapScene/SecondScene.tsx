import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { UserStats } from '@/app/types';
import { useLanguage } from '@/app/components/LanguageProvider';

type SecondSceneProps = {
    stats: UserStats;
    isPaused: boolean;
    finalState?: boolean;
};

const HOURS_DURATION = 2000;
const DAYS_DURATION = 2000;
const MONTHS_DURATION = 2000;
const POST_DELAY = 1000;
const TOTAL_SEQUENCE_DURATION = HOURS_DURATION + DAYS_DURATION + MONTHS_DURATION + POST_DELAY;
const HOURS_PER_DAY = 24;
const HOURS_PER_MONTH = 24 * 30;

export const SecondScene: React.FC<SecondSceneProps> = ({ stats, isPaused, finalState = false }) => {
    const { t } = useLanguage();
    const [hoursCounter, setHoursCounter] = useState(0);
    const [daysCounter, setDaysCounter] = useState(0);
    const [monthsCounter, setMonthsCounter] = useState(0);
    const elapsedRef = useRef(0);
    const lastTimestampRef = useRef<number | null>(null);

    const totalHours = Math.max(0, Math.round(stats.totalHours));
    const totalDays = useMemo(() => {
        if (!totalHours) return 0;
        return Number((totalHours / HOURS_PER_DAY).toFixed(1));
    }, [totalHours]);
    const totalMonths = useMemo(() => {
        if (!totalHours) return 0;
        return Number((totalHours / HOURS_PER_MONTH).toFixed(1));
    }, [totalHours]);

    useEffect(() => {
        elapsedRef.current = 0;
        lastTimestampRef.current = null;
        if (finalState) {
            setHoursCounter(totalHours);
            setDaysCounter(totalDays);
            setMonthsCounter(totalMonths);
            return;
        }
        setHoursCounter(0);
        setDaysCounter(0);
        setMonthsCounter(0);
    }, [finalState, totalDays, totalHours, totalMonths]);

    useEffect(() => {
        if (finalState) {
            return;
        }
        if (!totalHours) {
            setHoursCounter(0);
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
            const hoursProgress = Math.min(elapsed / HOURS_DURATION, 1);
            const daysProgress = Math.min(Math.max((elapsed - HOURS_DURATION) / DAYS_DURATION, 0), 1);
            const monthsProgress = Math.min(
                Math.max((elapsed - HOURS_DURATION - DAYS_DURATION) / MONTHS_DURATION, 0),
                1
            );

            setHoursCounter(Math.floor(totalHours * hoursProgress));
            setDaysCounter(Number((totalDays * daysProgress).toFixed(1)));
            setMonthsCounter(Number((totalMonths * monthsProgress).toFixed(1)));

            if (elapsed >= TOTAL_SEQUENCE_DURATION) {
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [finalState, isPaused, totalHours]);

    const ringProgress = totalHours ? hoursCounter / totalHours : 0;
    const ringStyle = {
        background: `conic-gradient(var(--brand-purple) ${ringProgress * 360}deg, rgba(var(--foreground-rgb),0.2) 0deg)`,
    };

    return (
        <motion.div
            key="total_time"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <div className="absolute inset-0 bg-[var(--background)]" />
            <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 px-6 text-center">
                <p className="text-base uppercase tracking-[0.4em] text-[var(--brand-purple)]">
                    {t('recap.totalGamingTimeTitle')}
                </p>

                <div className="relative flex h-36 w-36 items-center justify-center">
                    <div
                        className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(var(--brand-purple-rgb),0.35)]"
                        style={ringStyle}
                    />
                    <div className="absolute inset-2 rounded-full bg-[var(--background)] border border-[rgba(var(--foreground-rgb),0.12)]" />
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-4xl font-black text-[var(--brand-green)] tabular-nums">
                            {hoursCounter}
                        </span>
                        {/* "ORE/HRS" */}
                        <span className="text-xs uppercase tracking-[0.3em] text-[var(--brand-green)]">
                            {t('recap.hoursShort')}
                        </span>
                    </div>
                </div>
                {/* HOURS SPENT IN GAMING */}
                <p className="text-base text-[var(--brand-green)]">
                    {t('recap.gamingTimeCopy', { hours: hoursCounter })}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center w-full">
                    {/* EQUIVALENT DAYS */}
                    <div className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] px-4 py-4">
                        <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                            {t('recap.equivalentDays')}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-[var(--brand-green)] tabular-nums">
                            {totalDays ? daysCounter : 0}
                        </p>
                    </div>
                    {/* EQUIVALENT MONTHS */}
                    <div className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] px-4 py-4">
                        <p className="text-xs uppercase tracking-widest text-[var(--brand-purple)]">
                            {t('recap.equivalentMonths')}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-[var(--brand-green)] tabular-nums">
                            {totalMonths ? monthsCounter : 0}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
