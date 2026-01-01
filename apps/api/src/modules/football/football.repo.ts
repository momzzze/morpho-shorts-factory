// Repository layer for football data.
// Currently we only fetch live data; DB persistence can be added later.
import type { FootballMatch } from '../../services/footballMatchService.js';

export const footballRepo = {
  async upsertMatches(_matches: FootballMatch[]): Promise<void> {
    // no-op for now; placeholder for future persistence (e.g., Prisma upsert)
  },
};
