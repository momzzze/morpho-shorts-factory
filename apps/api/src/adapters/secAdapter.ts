/**
 * SEC Data Adapter
 *
 * Fetches company data from SEC EDGAR API
 * https://www.sec.gov/edgar/sec-api-documentation
 */

import axios from 'axios';
import { logger } from '../logger.js';
import { cacheService } from '../services/cacheService.js';

const SEC_API_BASE = 'https://data.sec.gov';
const SEC_USER_AGENT = 'MorphoShortsFactory info@morpho.com'; // SEC requires user agent

const secClient = axios.create({
  baseURL: SEC_API_BASE,
  headers: {
    'User-Agent': SEC_USER_AGENT,
  },
  timeout: 30000,
});

export interface SECCompanyInfo {
  cik: string;
  ticker: string;
  name: string;
  sic?: string;
}

export interface SECCompanyFacts {
  cik: string;
  entityName: string;
  facts: {
    'us-gaap'?: Record<string, any>;
    dei?: Record<string, any>;
  };
}

export const secAdapter = {
  /**
   * Resolve ticker to CIK using SEC ticker mapping
   * Cached for 24 hours
   */
  async tickerToCIK(ticker: string): Promise<string | null> {
    const cacheKey = `sec:ticker_cik_map:v1`;

    try {
      // Try cache first
      let tickerMap = await cacheService.get<Record<string, string>>(cacheKey);

      if (!tickerMap) {
        // Use fallback ticker map since SEC endpoint structure changed
        logger.info('Using fallback SEC ticker mapping');
        tickerMap = {
          AAPL: '0000320193',
          MSFT: '0000789019',
          GOOGL: '0001652044',
          GOOG: '0001652044',
          AMZN: '0001018724',
          META: '0001326801',
          TSLA: '0001318605',
          NVDA: '0001045810',
          JPM: '0000019617',
          V: '0001403161',
          JNJ: '0000200406',
          WMT: '0000104169',
          PG: '0000080424',
          MA: '0001141391',
          HD: '0000354950',
          DIS: '0001001039',
          NFLX: '0001065280',
          PYPL: '0001633917',
          INTC: '0000050863',
          AMD: '0000002488',
        };

        // Cache for 24 hours
        await cacheService.set(cacheKey, tickerMap, 86400);
        logger.info(
          { count: Object.keys(tickerMap).length },
          'Cached SEC ticker mapping'
        );
      }

      const normalizedTicker = ticker.toUpperCase();
      return tickerMap[normalizedTicker] || null;
    } catch (error) {
      logger.error({ error, ticker }, 'Failed to resolve ticker to CIK');
      return null;
    }
  },

  /**
   * Get company facts from SEC (all financial data)
   * Optional caching for 7 days
   */
  async getCompanyFacts(
    cik: string,
    useCache = true
  ): Promise<SECCompanyFacts | null> {
    const paddedCIK = cik.padStart(10, '0');
    const cacheKey = `sec:companyfacts:${paddedCIK}`;

    try {
      // Try cache if enabled
      if (useCache) {
        const cached = await cacheService.get<SECCompanyFacts>(cacheKey);
        if (cached) {
          logger.debug({ cik: paddedCIK }, 'SEC company facts cache hit');
          return cached;
        }
      }

      // Fetch from SEC
      logger.info({ cik: paddedCIK }, 'Fetching company facts from SEC');
      const response = await secClient.get(
        `/api/xbrl/companyfacts/CIK${paddedCIK}.json`
      );

      const facts: SECCompanyFacts = response.data;

      // Cache for 7 days (optional - DB should be primary)
      if (useCache) {
        await cacheService.set(cacheKey, facts, 604800);
      }

      return facts;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.warn({ cik: paddedCIK }, 'Company not found in SEC database');
        return null;
      }

      logger.error(
        { error, cik: paddedCIK },
        'Failed to fetch SEC company facts'
      );
      return null;
    }
  },

  /**
   * Parse SEC facts into normalized fundamentals data
   */
  parseFundamentals(facts: SECCompanyFacts): Array<{
    periodType: string;
    periodEnd: Date;
    revenue: number | null;
    netIncome: number | null;
    assets: number | null;
    liabilities: number | null;
    equity: number | null;
    cfo: number | null;
  }> {
    const usGaap = facts.facts['us-gaap'];
    if (!usGaap) return [];

    const result: any[] = [];

    try {
      // Extract key metrics
      const revenueData = usGaap['Revenues']?.units?.USD || [];
      const netIncomeData = usGaap['NetIncomeLoss']?.units?.USD || [];
      const assetsData = usGaap['Assets']?.units?.USD || [];
      const liabilitiesData = usGaap['Liabilities']?.units?.USD || [];
      const equityData = usGaap['StockholdersEquity']?.units?.USD || [];
      const cfoData =
        usGaap['NetCashProvidedByUsedInOperatingActivities']?.units?.USD || [];

      // Group by period
      const periods = new Map<string, any>();

      // Helper to add data point
      const addDataPoint = (data: any[], field: string) => {
        data.forEach((item: any) => {
          if (item.form === '10-K' || item.form === '10-Q') {
            const key = `${item.end}-${item.form}`;
            if (!periods.has(key)) {
              periods.set(key, {
                periodEnd: new Date(item.end),
                periodType: item.form === '10-K' ? 'annual' : 'quarter',
                form: item.form,
              });
            }
            periods.get(key)[field] = item.val;
          }
        });
      };

      addDataPoint(revenueData, 'revenue');
      addDataPoint(netIncomeData, 'netIncome');
      addDataPoint(assetsData, 'assets');
      addDataPoint(liabilitiesData, 'liabilities');
      addDataPoint(equityData, 'equity');
      addDataPoint(cfoData, 'cfo');

      // Convert to array and sort by date (newest first)
      result.push(
        ...Array.from(periods.values()).sort(
          (a, b) => b.periodEnd.getTime() - a.periodEnd.getTime()
        )
      );
    } catch (error) {
      logger.error(
        { error, cik: facts.cik },
        'Failed to parse SEC fundamentals'
      );
    }

    return result;
  },

  /**
   * Get latest annual fundamentals (10-K)
   */
  async getLatestAnnualFundamentals(cik: string) {
    const facts = await this.getCompanyFacts(cik);
    if (!facts) return null;

    const fundamentals = this.parseFundamentals(facts);
    return fundamentals.find((f) => f.periodType === 'annual') || null;
  },
};

export default secAdapter;
