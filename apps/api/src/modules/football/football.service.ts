import { footballMatchService } from '../../services/footballMatchService.js';
import { footballAdapter } from './football.adapter.js';
import { footballRepo } from './football.repo.js';
import type { ScoredMatch } from '../../services/footballMatchService.js';

export interface GetHighlightsInput {
  leagueId: number;
  limit: number;
}

export const footballModuleService = {
  async getHighlights({ leagueId, limit }: GetHighlightsInput) {
    // 1) Fetch matches from adapter (FotMob today/yesterday)
    const matches = await footballAdapter.fetchLeagueMatches(leagueId);

    // 2) Enrich with stats
    const enriched = await footballAdapter.enrichMatches(matches);

    // 3) Score and rank
    const ranked: ScoredMatch[] = footballMatchService.selectBestMatches(
      enriched,
      { minGoals: 1, minExcitementScore: 0 },
      limit
    );

    // 4) Attach highlight URLs (YouTube search)
    const withVideos = await Promise.all(
      ranked.map(async (match) => {
        const videoUrl = await footballAdapter.findHighlightUrl(
          match.homeTeam,
          match.awayTeam,
          match.league || 'Unknown'
        );

        if (videoUrl) {
          return {
            ...match,
            highlightVideos: [
              {
                url: videoUrl,
                source: 'youtube' as const,
                platform: 'youtube',
                duration: 0,
                quality: 'unknown',
              },
            ],
          };
        }
        return match;
      })
    );

    // 5) (optional) persist snapshot
    await footballRepo.upsertMatches(withVideos);

    return {
      count: withVideos.length,
      withVideos: withVideos.filter((m) => m.highlightVideos?.length).length,
      matches: withVideos,
    };
  },
};
