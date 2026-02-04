export interface UserStats {
  year: number;
  topGame: string | null;
  totalHours: number;
  playstyle: string;
  longestSession: number;
  steamPersonaName: string | null;
  steamAvatarUrl: string | null;
  steamProfileLevel: number | null;
  steamProfileCreatedAt: number | null;
  steamTopGames: { name: string; hours: number; appid?: number | null }[];
  steamAchievements: { game: string; name: string; percent: number | null }[];
  steamRareAchievements: { game: string; name: string; percent: number | null }[];
  steamCompletedGames: { name: string; appid: number; hours: number }[];
  steamGamesCount: number;
  steamRecentHours: number;
  riotRank: string | null;
  riotWins: number;
  riotLosses: number;
  riotFavorite: string | null;
  riotWinRate: number;
}
