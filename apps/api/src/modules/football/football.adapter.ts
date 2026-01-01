import {
  footballScraperService,
  FOTMOB_LEAGUE_IDS,
} from '../../services/footballScraperService.js';
import type { FootballMatch } from '../../services/footballMatchService.js';

// Adapter: thin layer over the scraper service so we can swap providers later
export const footballAdapter = {
  leagueIds: FOTMOB_LEAGUE_IDS,

  async fetchLeagueMatches(leagueId: number): Promise<FootballMatch[]> {
    return footballScraperService.getLeagueMatches(leagueId);
  },

  async enrichMatches(matches: FootballMatch[]): Promise<FootballMatch[]> {
    return footballScraperService.enrichMatchesWithStats(matches);
  },

  async findHighlightUrl(
    homeTeam: string,
    awayTeam: string,
    league: string
  ): Promise<string | null> {
    return footballScraperService.searchYouTubeHighlights(
      homeTeam,
      awayTeam,
      league
    );
  },
};
