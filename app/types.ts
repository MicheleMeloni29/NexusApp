export interface UserStats {
  year: number;
  topGame: string | null;
  totalHours: number;
  playstyle: string;
  longestSession: number;
  steamGamesCount: number;
  steamRecentHours: number;
  riotRank: string | null;
  riotWins: number;
  riotLosses: number;
  riotFavorite: string | null;
  riotWinRate: number;
}
