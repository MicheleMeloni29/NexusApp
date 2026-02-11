"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import type { UserStats } from "@/app/types";
import { useLanguage } from "@/app/components/LanguageProvider";

type PlayerCardProps = {
  stats: UserStats;
  className?: string;
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const gridVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);

const formatOptionalNumber = (value: number | null | undefined, digits = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return formatNumber(value, digits);
};

const formatHours = (value: number | null | undefined, digits = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${formatNumber(value, digits)}h`;
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  const normalized = value > 1 ? value / 100 : value;
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(normalized);
};

const formatDate = (epochSeconds: number | null | undefined) => {
  if (!epochSeconds) return "--";
  const date = new Date(epochSeconds * 1000);
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getYearsActive = (epochSeconds: number | null | undefined) => {
  if (!epochSeconds) return null;
  const createdAt = new Date(epochSeconds * 1000);
  const now = new Date();
  let years = now.getFullYear() - createdAt.getFullYear();
  const isBeforeAnniversary =
    now.getMonth() < createdAt.getMonth() ||
    (now.getMonth() === createdAt.getMonth() && now.getDate() < createdAt.getDate());
  if (isBeforeAnniversary) {
    years -= 1;
  }
  return Math.max(0, years);
};

const Badge = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full border border-[rgba(var(--foreground-rgb),0.2)] px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)]">
    {children}
  </span>
);

const StatTile = ({
  label,
  value,
  accent = "green",
}: {
  label: string;
  value: ReactNode;
  accent?: "green" | "purple";
}) => {
  const colorClass =
    accent === "purple"
      ? "text-[var(--brand-purple)]"
      : "text-[var(--brand-green)]";
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-4"
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-purple)]">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${colorClass}`}>{value}</p>
    </motion.div>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <motion.div
    variants={itemVariants}
    className="rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-[rgba(var(--brand-black-rgb),0.55)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
  >
    <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--brand-purple)]">
      {title}
    </p>
    <div className="mt-4 space-y-3">{children}</div>
  </motion.div>
);

const ListBlock = ({
  items,
  emptyLabel,
  children,
}: {
  items: unknown[];
  emptyLabel: string;
  children: ReactNode;
}) =>
  items.length ? (
    <ul className="space-y-2">{children}</ul>
  ) : (
    <p className="text-sm text-[rgba(var(--foreground-rgb),0.6)]">{emptyLabel}</p>
  );

export default function PlayerCard({ stats, className }: PlayerCardProps) {
  const { t } = useLanguage();

  const nickname = stats.steamPersonaName ?? t("recap.unknownPlayer");
  const avatarUrl = stats.steamAvatarUrl ?? "";
  const topGame = stats.topGame ?? t("recap.unknownGame");
  const totalHours = Math.max(0, Math.round(stats.totalHours));
  const longestSession = Math.max(0, stats.longestSession);
  const recentHours = Math.max(0, stats.steamRecentHours);
  const wins = Math.max(0, stats.riotWins);
  const losses = Math.max(0, stats.riotLosses);
  const totalMatches = wins + losses;
  const winRate = stats.riotWinRate ?? (totalMatches ? (wins / totalMatches) * 100 : null);
  const yearsActive = getYearsActive(stats.steamProfileCreatedAt);

  const topGenres = stats.steamTopGenres.slice(0, 3);
  const topGames = stats.steamTopGames.slice(0, 3);
  const topAchievements = stats.steamAchievements.slice(0, 3);
  const topRareAchievements = stats.steamRareAchievements.slice(0, 3);
  const completedGames = stats.steamCompletedGames.slice(0, 3);

  const showRiot =
    stats.riotRank ||
    stats.riotFavorite ||
    stats.riotWins > 0 ||
    stats.riotLosses > 0 ||
    stats.riotWinRate > 0;

  return (
    <motion.section
      variants={cardVariants}
      initial="hidden"
      animate="show"
      className={`relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-[rgba(var(--foreground-rgb),0.2)] bg-[rgba(var(--brand-black-rgb),0.85)] p-6 text-[var(--foreground)] shadow-[0_40px_140px_rgba(0,0,0,0.45)] md:p-8 ${
        className ?? ""
      }`}
    >
      <div className="pointer-events-none absolute -left-12 top-0 h-56 w-56 rounded-full bg-[rgba(var(--brand-purple-rgb),0.2)] blur-[120px]" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[rgba(var(--brand-green-rgb),0.2)] blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "36px 36px" }} />

      <div className="relative z-10 flex flex-col gap-6">
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-[rgba(var(--brand-purple-rgb),0.35)] blur-xl" />
                <Image
                  src={avatarUrl}
                  alt={t("recap.avatarAlt", { name: nickname })}
                  width={64}
                  height={64}
                  sizes="64px"
                  unoptimized
                  className="relative h-16 w-16 rounded-full border-2 border-[var(--brand-purple)] object-cover shadow-[0_0_25px_rgba(var(--brand-purple-rgb),0.4)]"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--brand-purple)] bg-[rgba(var(--foreground-rgb),0.06)] text-2xl font-black text-[var(--foreground)]">
                {nickname.charAt(0).toUpperCase() || "N"}
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-purple)]">
                {t("playerCard.title")}
              </p>
              <h2 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
                {nickname}
              </h2>
              <p className="text-sm text-[rgba(var(--foreground-rgb),0.6)]">
                {t("playerCard.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>
              {stats.year ? t("playerCard.season", { year: stats.year }) : t("playerCard.seasonUnknown")}
            </Badge>
            {stats.playstyle ? <Badge>{stats.playstyle}</Badge> : null}
            {topGenres[0]?.name ? <Badge>{topGenres[0].name}</Badge> : null}
          </div>
        </header>

        <motion.div variants={gridVariants} className="grid gap-6 lg:grid-cols-[1.1fr_1.6fr]">
          <div className="space-y-6">
            <Section title={t("playerCard.profile")}>
              <motion.div variants={gridVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatTile
                  label={t("recap.profileLevel")}
                  value={formatOptionalNumber(stats.steamProfileLevel)}
                />
                <StatTile
                  label={t("recap.profileCreated")}
                  value={formatDate(stats.steamProfileCreatedAt)}
                  accent="purple"
                />
                <StatTile
                  label={t("recap.yearsActive")}
                  value={yearsActive === null ? "--" : formatOptionalNumber(yearsActive)}
                />
              </motion.div>
            </Section>

            <Section title={t("playerCard.stats")}>
              <motion.div variants={gridVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatTile
                  label={t("playerCard.totalHours")}
                  value={`${formatOptionalNumber(totalHours)} ${t("recap.hoursShort")}`}
                />
                <StatTile
                  label={t("playerCard.longestSession")}
                  value={formatHours(longestSession, 1)}
                  accent="purple"
                />
                <StatTile
                  label={t("playerCard.recentHours")}
                  value={formatHours(recentHours, 1)}
                />
                <StatTile
                  label={t("playerCard.gamesCount")}
                  value={formatOptionalNumber(stats.steamGamesCount)}
                  accent="purple"
                />
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-4 sm:col-span-2"
                >
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-purple)]">
                    {t("recap.mostPlayed")}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[var(--brand-green)]">
                    {topGame}
                  </p>
                </motion.div>
              </motion.div>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title={t("playerCard.steam")}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--brand-purple)]">
                    {t("playerCard.topGames")}
                  </p>
                  <div className="mt-3 max-h-44 overflow-y-auto pr-2">
                    <ListBlock items={topGames} emptyLabel={t("recap.noData")}>
                      {topGames.map((game) => (
                        <li
                          key={`${game.name}-${game.appid ?? ""}`}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="font-semibold text-[var(--foreground)]">
                            {game.name || t("recap.unknownGame")}
                          </span>
                          <span className="text-[rgba(var(--foreground-rgb),0.6)]">
                            {formatHours(game.hours)}
                          </span>
                        </li>
                      ))}
                    </ListBlock>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--brand-purple)]">
                    {t("playerCard.topGenres")}
                  </p>
                  <div className="mt-3 max-h-44 overflow-y-auto pr-2">
                    <ListBlock items={topGenres} emptyLabel={t("recap.noData")}>
                      {topGenres.map((genre) => (
                        <li
                          key={genre.name}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="font-semibold text-[var(--foreground)]">
                            {genre.name}
                          </span>
                          <span className="text-[rgba(var(--foreground-rgb),0.6)]">
                            {formatPercent(genre.percent)}
                          </span>
                        </li>
                      ))}
                    </ListBlock>
                  </div>
                </div>
              </div>
            </Section>

            <Section title={t("playerCard.achievements")}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--brand-purple)]">
                    {t("playerCard.achievements")}
                  </p>
                  <div className="mt-3 max-h-40 overflow-y-auto pr-2">
                    <ListBlock items={topAchievements} emptyLabel={t("recap.noData")}>
                      {topAchievements.map((achievement, index) => (
                        <li key={`${achievement.name}-${index}`} className="text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-[var(--foreground)]">
                              {achievement.name}
                            </span>
                            <span className="text-[rgba(var(--foreground-rgb),0.6)]">
                              {achievement.percent === null
                                ? "--"
                                : formatPercent(achievement.percent)}
                            </span>
                          </div>
                          <span className="text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                            {achievement.game || t("recap.unknownGame")}
                          </span>
                        </li>
                      ))}
                    </ListBlock>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--brand-purple)]">
                    {t("playerCard.rareAchievements")}
                  </p>
                  <div className="mt-3 max-h-40 overflow-y-auto pr-2">
                    <ListBlock items={topRareAchievements} emptyLabel={t("recap.noData")}>
                      {topRareAchievements.map((achievement, index) => (
                        <li key={`${achievement.name}-${index}`} className="text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-[var(--foreground)]">
                              {achievement.name}
                            </span>
                            <span className="text-[rgba(var(--foreground-rgb),0.6)]">
                              {achievement.percent === null
                                ? "--"
                                : formatPercent(achievement.percent)}
                            </span>
                          </div>
                          <span className="text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                            {achievement.game || t("recap.unknownGame")}
                          </span>
                        </li>
                      ))}
                    </ListBlock>
                  </div>
                </div>
              </div>
            </Section>

            <Section title={t("playerCard.completedGames")}>
              <div className="max-h-40 overflow-y-auto pr-2">
                <ListBlock items={completedGames} emptyLabel={t("recap.noData")}>
                  {completedGames.map((game) => (
                    <li
                      key={`${game.appid}-${game.name}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-semibold text-[var(--foreground)]">
                        {game.name || t("recap.unknownGame")}
                      </span>
                      <span className="text-[rgba(var(--foreground-rgb),0.6)]">
                        {formatHours(game.hours)}
                      </span>
                    </li>
                  ))}
                </ListBlock>
              </div>
            </Section>

            {showRiot ? (
              <Section title={t("playerCard.riot")}>
                <motion.div variants={gridVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <StatTile
                    label={t("playerCard.rank")}
                    value={stats.riotRank ?? "--"}
                    accent="purple"
                  />
                  <StatTile label={t("playerCard.winRate")} value={formatPercent(winRate)} />
                  <StatTile label={t("playerCard.wins")} value={formatOptionalNumber(wins)} />
                  <StatTile label={t("playerCard.losses")} value={formatOptionalNumber(losses)} />
                  <motion.div
                    variants={itemVariants}
                    className="rounded-2xl border-2 border-[rgba(var(--brand-purple-rgb),0.4)] bg-[rgba(var(--foreground-rgb),0.06)] px-4 py-4 sm:col-span-2"
                  >
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-purple)]">
                      {t("playerCard.favorite")}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--brand-green)]">
                      {stats.riotFavorite ?? "--"}
                    </p>
                  </motion.div>
                </motion.div>
              </Section>
            ) : null}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
