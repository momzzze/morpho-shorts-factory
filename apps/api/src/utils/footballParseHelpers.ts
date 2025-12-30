export function parseScoreStr(scoreStr?: string): {
  home: number;
  away: number;
} {
  if (!scoreStr) return { home: 0, away: 0 };

  const m = scoreStr.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return { home: 0, away: 0 };

  return { home: Number(m[1]), away: Number(m[2]) };
}

export function isFinished(match: any): boolean {
  return (
    match?.status?.finished === true ||
    match?.status?.reason?.short === 'FT' ||
    match?.status?.reason?.long === 'Full-Time'
  );
}
