import { notPostedRound, type FourBallScore } from "./four-ball";

/**
 * Ewing Cup scores, keyed by the official last-name pair.
 * Mid-amateur rows are in EWING_2026_MIDAM_SCORES; senior rows are in
 * EWING_2026_SENIOR_SCORES. Extend a team's `rounds` tuple with Saturday and
 * Sunday totals when those rounds are posted. Leave a missing round as null;
 * never fill it with zero.
 */
export type MidAmScoreEntry = {
  pair: string;
  officialPosition: string;
  rounds: [number | null, number | null, number | null];
  /** 0-based index of a withdrawn round. Strokes stay null; do not fill with zero. */
  withdrawnRound?: 0 | 1 | 2;
  total: number | null;
  toPar: number | null;
};

export const EWING_2026_MIDAM_SCORES: MidAmScoreEntry[] = [
  { pair: "Keyes + Sass", officialPosition: "1", rounds: [62, 70, 66], total: 198, toPar: -18 },
  { pair: "Randle + Verses", officialPosition: "2", rounds: [63, 74, 68], total: 205, toPar: -11 },
  { pair: "Crawford + Heidrick", officialPosition: "T3", rounds: [68, 70, 68], total: 206, toPar: -10 },
  { pair: "Zamorano + McCarroll", officialPosition: "T3", rounds: [67, 73, 66], total: 206, toPar: -10 },
  { pair: "Paterson + Chung", officialPosition: "T5", rounds: [70, 72, 65], total: 207, toPar: -9 },
  { pair: "Cook + Rowen", officialPosition: "T5", rounds: [65, 72, 70], total: 207, toPar: -9 },
  { pair: "Atkinson + Hatter", officialPosition: "T7", rounds: [66, 73, 69], total: 208, toPar: -8 },
  { pair: "Collier + Hudelson", officialPosition: "T7", rounds: [71, 71, 66], total: 208, toPar: -8 },
  { pair: "Winslett + McDonald", officialPosition: "T7", rounds: [68, 74, 66], total: 208, toPar: -8 },
  { pair: "Dwyer + Jenkins", officialPosition: "T10", rounds: [65, 73, 72], total: 210, toPar: -6 },
  { pair: "Smith + Dickerson", officialPosition: "T10", rounds: [68, 72, 70], total: 210, toPar: -6 },
  { pair: "Pagnam + Baxter", officialPosition: "T10", rounds: [69, 71, 70], total: 210, toPar: -6 },
  { pair: "Morley-Stockton + Wilkins", officialPosition: "T10", rounds: [70, 71, 69], total: 210, toPar: -6 },
  { pair: "Black + Kirkpatrick", officialPosition: "T10", rounds: [69, 73, 68], total: 210, toPar: -6 },
  { pair: "Russell + Stollenwerck", officialPosition: "T15", rounds: [70, 70, 71], total: 211, toPar: -5 },
  { pair: "Woolf + Vinar", officialPosition: "T15", rounds: [67, 74, 70], total: 211, toPar: -5 },
  { pair: "Fleenor + Johnson", officialPosition: "T15", rounds: [69, 75, 67], total: 211, toPar: -5 },
  { pair: "Minahan + Holland", officialPosition: "T18", rounds: [68, 71, 73], total: 212, toPar: -4 },
  { pair: "Govender + Adams", officialPosition: "T18", rounds: [70, 75, 67], total: 212, toPar: -4 },
  { pair: "Samp + Kraul", officialPosition: "T18", rounds: [70, 68, 74], total: 212, toPar: -4 },
  { pair: "Munson + Mitchell", officialPosition: "T21", rounds: [73, 66, 74], total: 213, toPar: -3 },
  { pair: "Christiansen + Minton", officialPosition: "T21", rounds: [68, 74, 71], total: 213, toPar: -3 },
  { pair: "Keane + Grice", officialPosition: "T23", rounds: [67, 74, 73], total: 214, toPar: -2 },
  { pair: "Palmer + Holtgrieve", officialPosition: "T23", rounds: [72, 75, 67], total: 214, toPar: -2 },
  { pair: "Comerford + Lewis", officialPosition: "25", rounds: [71, 74, 70], total: 215, toPar: -1 },
  { pair: "DePasquale + Sandefur", officialPosition: "26", rounds: [69, 76, 71], total: 216, toPar: 0 },
  { pair: "Noble + Vance", officialPosition: "T27", rounds: [71, 72, 74], total: 217, toPar: 1 },
  { pair: "Amparan + Ezmerlian", officialPosition: "T27", rounds: [75, 76, 66], total: 217, toPar: 1 },
  { pair: "Jones + Oakley", officialPosition: "29", rounds: [76, 73, 70], total: 219, toPar: 3 },
  { pair: "Roudebush + Gutesha", officialPosition: "30", rounds: [75, 74, 77], total: 226, toPar: 10 },
  { pair: "Elkington + Tracy", officialPosition: "WD", rounds: [75, 69, null], withdrawnRound: 2, total: 144, toPar: null },
  { pair: "Espon + Kendrick", officialPosition: "WD", rounds: [72, 75, null], withdrawnRound: 2, total: 147, toPar: null },
];

const SUFFIX = /^(jr|sr|ii|iii|iv)\.?$/i;

export function lastName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => !SUFFIX.test(part));
  return parts.at(-1) ?? name;
}

export function pairKey(names: [string, string]) {
  return `${lastName(names[0])} + ${lastName(names[1])}`;
}

function posting(strokes: number | null, withdrawn = false) {
  if (withdrawn) return { strokes: null, status: "withdrawn" as const };
  return strokes == null ? notPostedRound() : { strokes, status: "complete" as const };
}

export function scoreFromEntry(entry: MidAmScoreEntry): FourBallScore {
  return {
    rounds: [
      posting(entry.rounds[0], entry.withdrawnRound === 0),
      posting(entry.rounds[1], entry.withdrawnRound === 1),
      posting(entry.rounds[2], entry.withdrawnRound === 2),
    ],
    total: entry.total,
    toPar: entry.toPar,
    thru: null,
    officialPosition: entry.officialPosition,
  };
}

export function midAmScoreFor(names: [string, string]): FourBallScore | null {
  const key = pairKey(names);
  const reversed = `${lastName(names[1])} + ${lastName(names[0])}`;
  const entry = EWING_2026_MIDAM_SCORES.find((row) => row.pair === key || row.pair === reversed);
  return entry ? scoreFromEntry(entry) : null;
}


export function midAmBoardIndex(names: [string, string]) {
  const key = pairKey(names);
  const reversed = `${lastName(names[1])} + ${lastName(names[0])}`;
  return EWING_2026_MIDAM_SCORES.findIndex((row) => row.pair === key || row.pair === reversed);
}

export function unusedMidAmScorePairs(teams: Array<{ division: string; names: [string, string] }>) {
  const used = new Set(
    teams
      .filter((team) => team.division === "mid-am")
      .flatMap((team) => [pairKey(team.names), `${lastName(team.names[1])} + ${lastName(team.names[0])}`]),
  );
  return EWING_2026_MIDAM_SCORES.filter((row) => !used.has(row.pair)).map((row) => row.pair);
}

export const EWING_2026_SENIOR_SCORES: MidAmScoreEntry[] = [
  { pair: "Stephenson + Sandlin", officialPosition: "1", rounds: [68, 69, 68], total: 205, toPar: -11 },
  { pair: "Stollenwerck + Barfield", officialPosition: "2", rounds: [67, 71, 68], total: 206, toPar: -10 },
  { pair: "Lohner + Vancil", officialPosition: "3", rounds: [66, 71, 71], total: 208, toPar: -8 },
  { pair: "Johnson + Tyner", officialPosition: "T4", rounds: [65, 74, 71], total: 210, toPar: -6 },
  { pair: "Brellenthin + Peterson", officialPosition: "T4", rounds: [66, 74, 70], total: 210, toPar: -6 },
  { pair: "Bruce + Bonneau", officialPosition: "T6", rounds: [67, 74, 73], total: 214, toPar: -2 },
  { pair: "Dean + Jones", officialPosition: "T6", rounds: [71, 72, 71], total: 214, toPar: -2 },
  { pair: "Motes + Landis", officialPosition: "8", rounds: [70, 73, 74], total: 217, toPar: 1 },
  { pair: "Schaefer + Pierce", officialPosition: "9", rounds: [72, 76, 72], total: 220, toPar: 4 },
  { pair: "Moore + Coutant", officialPosition: "10", rounds: [66, 76, 79], total: 221, toPar: 5 },
  { pair: "Dodson + Waldrip", officialPosition: "T11", rounds: [76, 72, 74], total: 222, toPar: 6 },
  { pair: "Dortch + Schneider", officialPosition: "T11", rounds: [73, 75, 74], total: 222, toPar: 6 },
  { pair: "Smith + Brewer", officialPosition: "13", rounds: [72, 76, 75], total: 223, toPar: 7 },
  { pair: "Allen + Tolliver", officialPosition: "14", rounds: [74, 75, 76], total: 225, toPar: 9 },
  { pair: "Dandurand + Carter", officialPosition: "15", rounds: [76, 74, 76], total: 226, toPar: 10 },
  { pair: "Gafner + Quinn", officialPosition: "16", rounds: [73, 76, 79], total: 228, toPar: 12 },
  { pair: "Crisco + Piersall", officialPosition: "17", rounds: [77, 76, 76], total: 229, toPar: 13 },
  { pair: "Aube + Childers", officialPosition: "18", rounds: [73, 82, 75], total: 230, toPar: 14 },
  { pair: "Steen + Houston", officialPosition: "WD", rounds: [70, 71, null], withdrawnRound: 2, total: 141, toPar: null },
  { pair: "Peck + Love", officialPosition: "WD", rounds: [74, 76, null], withdrawnRound: 2, total: 150, toPar: null },
];

export function seniorScoreFor(names: [string, string]): FourBallScore | null {
  const key = pairKey(names);
  const reversed = `${lastName(names[1])} + ${lastName(names[0])}`;
  const entry = EWING_2026_SENIOR_SCORES.find((row) => row.pair === key || row.pair === reversed);
  return entry ? scoreFromEntry(entry) : null;
}

export function seniorBoardIndex(names: [string, string]) {
  const key = pairKey(names);
  const reversed = `${lastName(names[1])} + ${lastName(names[0])}`;
  return EWING_2026_SENIOR_SCORES.findIndex((row) => row.pair === key || row.pair === reversed);
}

export function unusedSeniorScorePairs(teams: Array<{ division: string; names: [string, string] }>) {
  const used = new Set(
    teams
      .filter((team) => team.division === "senior")
      .flatMap((team) => [pairKey(team.names), `${lastName(team.names[1])} + ${lastName(team.names[0])}`]),
  );
  return EWING_2026_SENIOR_SCORES.filter((row) => !used.has(row.pair)).map((row) => row.pair);
}
