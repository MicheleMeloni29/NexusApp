import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserStats } from '../types';
import { Pause, Play, SkipForward } from 'lucide-react';
import { useLanguage } from '@/app/components/LanguageProvider';
import { FirstScene } from '@/app/components/videorecapScene/FirstScene';
import { SecondScene } from '@/app/components/videorecapScene/SecondScene';
import { ThirdScene } from '@/app/components/videorecapScene/ThirdScene';
import { FourthScene } from '@/app/components/videorecapScene/FourthScene';

interface VideoRecapProps {
    onComplete: () => void;
    stats: UserStats;
}

// DURATA DELLE SCENE
const scenes = [
    { id: 'intro', duration: 6000 },
    { id: 'total_time', duration: 6000 },
    { id: 'top_games', duration: 6000 },
    { id: 'steam_highlights', duration: 6000 },
];

export const VideoRecap: React.FC<VideoRecapProps> = ({ onComplete, stats }) => {
    const { t } = useLanguage();
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [sceneProgress, setSceneProgress] = useState(0);
    const elapsedRef = useRef(0);
    const lastTimestampRef = useRef<number | null>(null);

    useEffect(() => {
        elapsedRef.current = 0;
        lastTimestampRef.current = null;
        setSceneProgress(0);
    }, [currentSceneIndex]);

    useEffect(() => {
        const scene = scenes[currentSceneIndex];
        if (!scene) {
            onComplete();
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

            const progress = Math.min(elapsedRef.current / scene.duration, 1);
            setSceneProgress(progress);

            if (progress >= 1) {
                if (currentSceneIndex < scenes.length - 1) {
                    setCurrentSceneIndex(prev => prev + 1);
                } else {
                    onComplete();
                }
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [currentSceneIndex, isPaused, onComplete]);

    const currentScene = scenes[currentSceneIndex];

    return (
        <div className="fixed inset-0 text-[var(--foreground)] z-50 flex flex-col items-center justify-center overflow-hidden">
            {/* Pause Button */}
            <button
                onClick={() => setIsPaused(prev => !prev)}
                aria-label={isPaused ? t('recap.resume') : t('recap.pause')}
                className="absolute top-8 left-8 text-[rgba(var(--foreground-rgb),0.6)] hover:text-[var(--foreground)] flex items-center gap-2 z-50 transition-colors"
            >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>

            {/* Skip Button */}
            <button
                onClick={onComplete}
                className="absolute top-8 right-8 text-[rgba(var(--foreground-rgb),0.6)] hover:text-[var(--foreground)] flex items-center gap-2 z-50 transition-colors"
            >
                {t('recap.skip')} <SkipForward size={20} />
            </button>

            {/* Scene Progress */}
            <div className="absolute bottom-10 left-10 right-10 z-50">
                <div className="flex items-center gap-2">
                    {scenes.map((scene, index) => {
                        const isPast = index < currentSceneIndex;
                        const isCurrent = index === currentSceneIndex;
                        return (
                            <div
                                key={scene.id}
                                className="h-1.5 flex-1 rounded-full bg-[rgba(var(--foreground-rgb),0.2)] overflow-hidden"
                            >
                                {isPast ? (
                                    <div className="h-full w-full bg-[var(--brand-purple)] shadow-[0_0_14px_rgba(var(--brand-purple-rgb),0.6)]" />
                                ) : isCurrent ? (
                                    <div
                                        className="h-full bg-[var(--brand-purple)] shadow-[0_0_14px_rgba(var(--brand-purple-rgb),0.6)]"
                                        style={{ width: `${sceneProgress * 100}%` }}
                                    />
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {currentSceneIndex === 0 && (
                    <FirstScene stats={stats} isPaused={isPaused} />
                )}
                {currentSceneIndex === 1 && (
                    <SecondScene stats={stats} isPaused={isPaused} />
                )}
                {currentSceneIndex === 2 && (
                    <ThirdScene stats={stats} isPaused={isPaused} />
                )}
                {currentSceneIndex === 3 && (
                    <FourthScene stats={stats} isPaused={isPaused} />
                )}

            </AnimatePresence>

        </div>
    );
};
