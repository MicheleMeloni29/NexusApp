import type { UserStats } from "@/app/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const DEFAULT_USER_ID = Number(process.env.NEXT_PUBLIC_USER_ID ?? "1");

type Provider = "steam" | "riot";

function buildUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchRecap(userId: number = DEFAULT_USER_ID): Promise<UserStats> {
  const response = await fetch(buildUrl(`/recap?user_id=${userId}`), { cache: "no-store" });
  const payload = await handleResponse<Record<string, any>>(response);
  return {
    year: payload.year ?? new Date().getFullYear(),
    topGame: payload.top_game ?? null,
    totalHours: payload.total_hours ?? 0,
    playstyle: payload.playstyle ?? "Strategist",
    longestSession: payload.longest_session ?? 0,
    steamGamesCount: payload.steam_games_count ?? 0,
    steamRecentHours: payload.steam_recent_hours ?? 0,
    riotRank: payload.riot_rank ?? null,
    riotWins: payload.riot_wins ?? 0,
    riotLosses: payload.riot_losses ?? 0,
    riotFavorite: payload.riot_favorite ?? null,
    riotWinRate: payload.riot_win_rate ?? 0,
  };
}

export async function syncProvider(provider: Provider, userId: number = DEFAULT_USER_ID) {
  const response = await fetch(buildUrl(`/sync/${provider}?user_id=${userId}`), {
    method: "POST",
  });
  return handleResponse(response);
}
