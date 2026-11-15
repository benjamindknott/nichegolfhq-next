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
  total: number;
  toPar: number;
};

export const EWING_2026_MIDAM_SCORES: MidAmScoreEntry[] = [
  { pair: "Keyes + Sass", officialPosition: "1", rounds: [62, 70, null], total: 132, toPar: -12 },
  { pair: "Randle + Verses", officialPosition: "T2", rounds: [63, 74, null], total: 137, toPar: -7 },
  { pair: "Cook + Rowen", officialPosition: "T2", rounds: [65, 72, null], total: 137, toPar: -7 },
  { pair: "Samp + Kraul", officialPosition: "T4", rounds: [70, 68, null], total: 138, toPar: -6 },
  { pair: "Crawford + Heidrick", officialPosition: "T4", rounds: [68, 70, null], total: 138, toPar: -6 },
  { pair: "Dwyer + Jenkins", officialPosition: "T4", rounds: [65, 73, null], total: 138, toPar: -6 },
  { pair: "Munson + Mitchell", officialPosition: "T7", rounds: [73, 66, null], total: 139, toPar: -5 },
  { pair: "Atkinson + Hatter", officialPosition: "T7", rounds: [66, 73, null], total: 139, toPar: -5 },
  { pair: "Minahan + Holland", officialPosition: "T7", rounds: [68, 71, null], total: 139, toPar: -5 },
  { pair: "Smith + Dickerson", officialPosition: "T10", rounds: [68, 72, null], total: 140, toPar: -4 },
  { pair: "Zamorano + McCarroll", officialPosition: "T10", rounds: [67, 73, null], total: 140, toPar: -4 },
  { pair: "Pagnam + Baxter", officialPosition: "T10", rounds: [69, 71, null], total: 140, toPar: -4 },
  { pair: "Russell + Stollenwerck", officialPosition: "T10", rounds: [70, 70, null], total: 140, toPar: -4 },
  { pair: "Morley-Stockton + Wilkins", officialPosition: "T14", rounds: [70, 71, null], total: 141, toPar: -3 },
  { pair: "Woolf + Vinar", officialPosition: "T14", rounds: [67, 74, null], total: 141, toPar: -3 },
  { pair: "Keane + Grice", officialPosition: "T14", rounds: [67, 74, null], total: 141, toPar: -3 },
  { pair: "Paterson + Chung", officialPosition: "T17", rounds: [70, 72, null], total: 142, toPar: -2 },
  { pair: "Collier + Hudelson", officialPosition: "T17", rounds: [71, 71, null], total: 142, toPar: -2 },
  { pair: "Winslett + McDonald", officialPosition: "T17", rounds: [68, 74, null], total: 142, toPar: -2 },
  { pair: "Black + Kirkpatrick", officialPosition: "T17", rounds: [69, 73, null], total: 142, toPar: -2 },
  { pair: "Christiansen + Minton", officialPosition: "T17", rounds: [68, 74, null], total: 142, toPar: -2 },
  { pair: "Noble + Vance", officialPosition: "22", rounds: [71, 72, null], total: 143, toPar: -1 },
  { pair: "Elkington + Tracy", officialPosition: "T23", rounds: [75, 69, null], total: 144, toPar: 0 },
  { pair: "Fleenor + Johnson", officialPosition: "T23", rounds: [69, 75, null], total: 144, toPar: 0 },
  { pair: "DePasquale + Sandefur", officialPosition: "T25", rounds: [69, 76, null], total: 145, toPar: 1 },
  { pair: "Govender + Adams", officialPosition: "T25", rounds: [70, 75, null], total: 145, toPar: 1 },
  { pair: "Comerford + Lewis", officialPosition: "T25", rounds: [71, 74, null], total: 145, toPar: 1 },
  { pair: "Espon + Kendrick", officialPosition: "T28", rounds: [72, 75, null], total: 147, toPar: 3 },
  { pair: "Palmer + Holtgrieve", officialPosition: "T28", rounds: [72, 75, null], total: 147, toPar: 3 },
  { pair: "Jones + Oakley", officialPosition: "T30", rounds: [76, 73, null], total: 149, toPar: 5 },
  { pair: "Roudebush + Gutesha", officialPosition: "T30", rounds: [75, 74, null], total: 149, toPar: 5 },
  { pair: "Amparan + Ezmerlian", officialPosition: "32", rounds: [75, 76, null], total: 151, toPar: 7 },
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

function posting(strokes: number | null) {
  return strokes == null ? notPostedRound() : { strokes, status: "complete" as const };
}

export function scoreFromEntry(entry: MidAmScoreEntry): FourBallScore {
  return {
    rounds: [posting(entry.rounds[0]), posting(entry.rounds[1]), posting(entry.rounds[2])],
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
  { pair: "Lohner + Vancil", officialPosition: "T1", rounds: [66, 71, null], total: 137, toPar: -7 },
  { pair: "Stephenson + Sandlin", officialPosition: "T1", rounds: [68, 69, null], total: 137, toPar: -7 },
  { pair: "Stollenwerck + Barfield", officialPosition: "3", rounds: [67, 71, null], total: 138, toPar: -6 },
  { pair: "Johnson + Tyner", officialPosition: "4", rounds: [65, 74, null], total: 139, toPar: -5 },
  { pair: "Brellenthin + Peterson", officialPosition: "5", rounds: [66, 74, null], total: 140, toPar: -4 },
  { pair: "Steen + Houston", officialPosition: "T6", rounds: [70, 71, null], total: 141, toPar: -3 },
  { pair: "Bruce + Bonneau", officialPosition: "T6", rounds: [67, 74, null], total: 141, toPar: -3 },
  { pair: "Moore + Coutant", officialPosition: "8", rounds: [66, 76, null], total: 142, toPar: -2 },
  { pair: "Motes + Landis", officialPosition: "T9", rounds: [70, 73, null], total: 143, toPar: -1 },
  { pair: "Dean + Jones", officialPosition: "T9", rounds: [71, 72, null], total: 143, toPar: -1 },
  { pair: "Dodson + Waldrip", officialPosition: "T11", rounds: [76, 72, null], total: 148, toPar: 4 },
  { pair: "Dortch + Schneider", officialPosition: "T11", rounds: [73, 75, null], total: 148, toPar: 4 },
  { pair: "Smith + Brewer", officialPosition: "T11", rounds: [72, 76, null], total: 148, toPar: 4 },
  { pair: "Schaefer + Pierce", officialPosition: "T11", rounds: [72, 76, null], total: 148, toPar: 4 },
  { pair: "Allen + Tolliver", officialPosition: "T15", rounds: [74, 75, null], total: 149, toPar: 5 },
  { pair: "Gafner + Quinn", officialPosition: "T15", rounds: [73, 76, null], total: 149, toPar: 5 },
  { pair: "Peck + Love", officialPosition: "T17", rounds: [74, 76, null], total: 150, toPar: 6 },
  { pair: "Dandurand + Carter", officialPosition: "T17", rounds: [76, 74, null], total: 150, toPar: 6 },
  { pair: "Crisco + Piersall", officialPosition: "19", rounds: [77, 76, null], total: 153, toPar: 9 },
  { pair: "Aube + Childers", officialPosition: "20", rounds: [73, 82, null], total: 155, toPar: 11 },
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
