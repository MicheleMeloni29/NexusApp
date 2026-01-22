import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserStats } from '../types';
import { SkipForward, Crosshair, Zap, Crown, Timer, Gamepad, Brain, Library, Users, Heart, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/app/components/LanguageProvider';

interface VideoRecapProps {
    onComplete: () => void;
    stats: UserStats;
}

const scenes = [
    { id: 'intro', duration: 2500 },
    { id: 'top_game', duration: 3000 },
    { id: 'fps', duration: 3000 },
    { id: 'moba', duration: 3000 },
    { id: 'collection', duration: 3000 },
    { id: 'social', duration: 3000 },
    { id: 'playstyle', duration: 3000 },
    { id: 'outro', duration: 3000 },
];

export const VideoRecap: React.FC<VideoRecapProps> = ({ onComplete, stats }) => {
    const { t } = useLanguage();
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

    useEffect(() => {
        const scene = scenes[currentSceneIndex];
        if (!scene) {
            onComplete();
            return;
        }

        const timer = setTimeout(() => {
            if (currentSceneIndex < scenes.length - 1) {
                setCurrentSceneIndex(prev => prev + 1);
            } else {
                onComplete();
            }
        }, scene.duration);

        return () => clearTimeout(timer);
    }, [currentSceneIndex, onComplete]);

    const progress = ((currentSceneIndex + 1) / scenes.length) * 100;
    const topGame = stats.topGame ?? t('recap.unknownGame');

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden">
            {/* Skip Button */}
            <button
                onClick={onComplete}
                className="absolute top-8 right-8 text-white/50 hover:text-white flex items-center gap-2 z-50 transition-colors"
            >
                {t('recap.skip')} <SkipForward size={20} />
            </button>

            {/* Progress Bar */}
            <div className="absolute bottom-10 left-10 right-10 h-1 bg-gray-800 rounded-full overflow-hidden z-50">
                <motion.div
                    className="h-full bg-gaming-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <AnimatePresence mode="wait">
                {currentSceneIndex === 0 && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
                        className="text-center"
                    >
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white mb-4">
                            {stats.year}<br />{t('recap.unwrapped')}
                        </h1>
                        <p className="text-2xl text-gaming-accent font-mono animate-pulse">
                            {t('recap.analyzing')}
                        </p>
                    </motion.div>
                )}

                {currentSceneIndex === 1 && ( // Top Game Scene
                    <motion.div
                        key="top_game"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="text-center w-full max-w-4xl px-6"
                    >
                        <Gamepad className="w-24 h-24 text-purple-500 mx-auto mb-8" />
                        <h2 className="text-gray-400 text-xl font-mono mb-4 uppercase tracking-widest">{t('recap.mostPlayed')}</h2>
                        <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
                            {topGame.toUpperCase()}
                        </h1>
                        <div className="inline-block bg-purple-500/20 px-8 py-3 rounded-full border border-purple-500/50">
                            <p className="text-purple-400 font-bold text-xl">
                                {t('recap.hoursLogged', { hours: Math.floor(stats.totalHours * 0.7) })}
                            </p>
                        </div>
                    </motion.div>
                )}

                {currentSceneIndex === 2 && ( // FPS Stats
                    <motion.div
                        key="fps"
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        className="w-full max-w-4xl px-6 flex flex-col items-center"
                    >
                        <Crosshair className="w-24 h-24 text-red-500 mb-8" />
                        <div className="grid grid-cols-2 gap-12 text-center w-full">
                            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                                <h3 className="text-gray-400 text-sm font-mono mb-2 uppercase">{t('recap.precision')}</h3>
                                <p className="text-6xl font-bold text-white">42%</p>
                                <p className="text-red-500 text-sm mt-1">{t('recap.headshotRate')}</p>
                            </div>
                            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                                <h3 className="text-gray-400 text-sm font-mono mb-2 uppercase">{t('recap.peakRank')}</h3>
                                <p className="text-5xl font-bold text-white tracking-tight">{t('recap.peakRankValue')}</p>
                                <p className="text-red-500 text-sm mt-1">{t('recap.topPercent')}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentSceneIndex === 3 && ( // MOBA Stats
                    <motion.div
                        key="moba"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="w-full max-w-4xl px-6 flex flex-col items-center"
                    >
                        <Zap className="w-24 h-24 text-yellow-400 mb-8" />
                        <div className="grid grid-cols-3 gap-6 text-center w-full">
                            <div className="p-4">
                                <h3 className="text-gray-400 text-sm font-mono mb-1">{t('recap.totalMatches')}</h3>
                                <p className="text-5xl font-bold text-white">1,337</p>
                            </div>
                            <div className="p-4 border-x border-gray-800">
                                <h3 className="text-gray-400 text-sm font-mono mb-1">{t('recap.winRate')}</h3>
                                <p className="text-5xl font-bold text-yellow-400">58%</p>
                            </div>
                            <div className="p-4">
                                <h3 className="text-gray-400 text-sm font-mono mb-1">{t('recap.mvpAwards')}</h3>
                                <p className="text-5xl font-bold text-white">84</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentSceneIndex === 4 && ( // Collection Scene
                    <motion.div
                        key="collection"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        className="text-center w-full max-w-4xl px-6"
                    >
                        <Library className="w-24 h-24 text-green-400 mx-auto mb-8" />
                        <h2 className="text-gray-400 text-xl font-mono mb-4 uppercase tracking-widest">{t('recap.libraryGrowth')}</h2>
                        <div className="grid grid-cols-2 gap-8 mt-8">
                            <div className="bg-gray-900/50 p-6 rounded-2xl border border-green-500/30">
                                <p className="text-6xl font-bold text-white mb-2">12</p>
                                <p className="text-green-400 text-sm uppercase font-bold">{t('recap.newGames')}</p>
                            </div>
                            <div className="bg-gray-900/50 p-6 rounded-2xl border border-green-500/30">
                                <p className="text-6xl font-bold text-white mb-2">100%</p>
                                <p className="text-green-400 text-sm uppercase font-bold">{t('recap.completionRate')}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentSceneIndex === 5 && ( // Social Stats Scene
                    <motion.div
                        key="social"
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        className="text-center w-full max-w-4xl px-6"
                    >
                        <Users className="w-24 h-24 text-pink-500 mx-auto mb-8" />
                        <h2 className="text-gray-400 text-xl font-mono mb-8 uppercase tracking-widest">{t('recap.communityImpact')}</h2>
                        <div className="flex flex-col gap-6 items-center">
                            <div className="flex items-center gap-4 w-full justify-center">
                                <Heart className="text-pink-500" />
                                <span className="text-3xl font-bold text-white">
                                    450 <span className="text-gray-500 text-lg">{t('recap.ggReceived')}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 w-full justify-center">
                                <MessageCircle className="text-pink-500" />
                                <span className="text-3xl font-bold text-white">
                                    8,421 <span className="text-gray-500 text-lg">{t('recap.messagesSent')}</span>
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentSceneIndex === 6 && ( // Playstyle Scene
                    <motion.div
                        key="playstyle"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.1, opacity: 0 }}
                        className="text-center w-full max-w-4xl px-6"
                    >
                        <Brain className="w-24 h-24 text-cyan-400 mx-auto mb-8" />
                        <h2 className="text-gray-400 text-xl font-mono mb-4 uppercase tracking-widest">{t('recap.playstyleTitle')}</h2>
                        <h1 className="text-5xl md:text-6xl font-black text-white mb-8">
                            "{stats.playstyle.toUpperCase()}"
                        </h1>
                        <div className="flex justify-center gap-8 text-left">
                            <div className="flex items-center gap-3">
                                <Timer className="text-cyan-400" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">{t('recap.longestSession')}</p>
                                    <p className="text-xl font-bold text-white">
                                        {stats.longestSession} {t('recap.hours')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Crown className="text-cyan-400" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">{t('recap.topAchievement')}</p>
                                    <p className="text-xl font-bold text-white">{t('recap.topRegional')}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentSceneIndex === 7 && (
                    <motion.div
                        key="outro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                    >
                        <div className="relative inline-block">
                            <div className="absolute -inset-10 bg-gaming-accent/20 blur-xl rounded-full animate-pulse-slow"></div>
                            <Crown className="relative z-10 w-32 h-32 text-gaming-accent mx-auto mb-8" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold mb-4">{t('recap.legacyGenerated')}</h2>
                        <p className="text-gray-400">{t('recap.minting')}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gaming-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
            </div>
        </div>
    );
};
