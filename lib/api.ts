import type { UserStats } from "@/app/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const DEFAULT_USER_ID = Number(process.env.NEXT_PUBLIC_USER_ID ?? "1");

type Provider = "steam" | "riot";

type ProviderLoginOptions = {
  clientId?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

export type AuthUser = {
  user_id: number;
  email: string | null;
  email_verified?: boolean;
  steam_connected: boolean;
  riot_connected: boolean;
  steam_id?: string | null;
  riot_puuid?: string | null;
};

export type ProviderAvailability = {
  enabled: boolean;
  reason?: string;
};

export type ProvidersAvailability = Record<Provider, ProviderAvailability>;

function buildUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { detail?: string; message?: string };
    return payload.detail ?? payload.message ?? "";
  }
  return response.text();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export async function fetchRecap(userId: number = DEFAULT_USER_ID): Promise<UserStats | null> {
  const response = await fetch(buildUrl(`/recap?user_id=${userId}`), { cache: "no-store" });
  if (!response.ok) {
    const message = await readErrorMessage(response);
    const normalized = message.toLowerCase();
    if (
      response.status === 404 ||
      response.status === 400 ||
      normalized.includes("no stats available")
    ) {
      return null;
    }
    throw new ApiError(message, response.status);
  }
  const payload = (await response.json()) as Record<string, any>;
  return {
    year: payload.year ?? new Date().getFullYear(),
    topGame: payload.top_game ?? null,
    totalHours: payload.total_hours ?? 0,
    playstyle: payload.playstyle ?? "Strategist",
    longestSession: payload.longest_session ?? 0,
    steamPersonaName: payload.steam_persona_name ?? null,
    steamAvatarUrl: payload.steam_avatar_url ?? null,
    steamProfileLevel: payload.steam_profile_level ?? null,
    steamProfileCreatedAt: payload.steam_profile_created_at ?? null,
    steamTopGames: Array.isArray(payload.steam_top_games)
      ? payload.steam_top_games.map((game: { name?: string; hours?: number; appid?: number | null }) => ({
          name: game?.name ?? "Unknown",
          hours: typeof game?.hours === "number" ? game.hours : 0,
          appid: game?.appid ?? null,
        }))
      : [],
    steamTopGenres: Array.isArray(payload.steam_top_genres)
      ? payload.steam_top_genres.map((genre: { name?: string; percent?: number }) => ({
          name: genre?.name ?? "Unknown",
          percent: typeof genre?.percent === "number" ? genre.percent : 0,
        }))
      : [],
    steamAchievements: Array.isArray(payload.steam_achievements) ? payload.steam_achievements : [],
    steamRareAchievements: Array.isArray(payload.steam_rare_achievements) ? payload.steam_rare_achievements : [],
    steamCompletedGames: Array.isArray(payload.steam_completed_games) ? payload.steam_completed_games : [],
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

export async function disconnectProvider(provider: Provider) {
  const response = await fetch(buildUrl(`/auth/disconnect/${provider}`), {
    method: "POST",
    credentials: "include",
  });
  return handleResponse<{ ok: boolean }>(response);
}

export async function fetchProvidersAvailability(): Promise<ProvidersAvailability> {
  const response = await fetch(buildUrl("/auth/providers"), { cache: "no-store" });
  return handleResponse<ProvidersAvailability>(response);
}

export async function registerAccount(email: string, password: string) {
  const response = await fetch(buildUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<{ ok: boolean }>(response);
}

export async function loginAccount(email: string, password: string) {
  const response = await fetch(buildUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<{ user_id: number; email: string }>(response);
}

export async function logoutAccount() {
  const response = await fetch(buildUrl("/auth/logout"), {
    method: "POST",
    credentials: "include",
  });
  return handleResponse(response);
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(buildUrl("/auth/me"), {
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) {
    return null;
  }
  return handleResponse<AuthUser>(response);
}

export function buildProviderLoginUrl(provider: Provider, nextUrl?: string, options?: ProviderLoginOptions) {
  const url = new URL(buildUrl(`/auth/${provider}/start`));
  if (nextUrl) {
    url.searchParams.set("next", nextUrl);
  }
  if (options?.clientId) {
    url.searchParams.set("client_id", options.clientId);
  }
  return url.toString();
}
