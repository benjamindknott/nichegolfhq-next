import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FourBallBoard } from "../src/components/hubs/FourBallBoard";
import { EWING_SNAPSHOT, hasTimezoneOffset, verifyEwingSnapshot } from "../src/data/hubs/ewing-cup-four-ball";
import {
  auditScore,
  notPostedRound,
  progressKey,
  standings,
  totalCell,
  roundCell,
  type FourBallScore,
  type FourBallTeam,
} from "../src/data/hubs/four-ball";

function score(partial: Partial<FourBallScore> & Pick<FourBallScore, "total">): FourBallScore {
  return {
    rounds: partial.rounds ?? [notPostedRound(), notPostedRound(), notPostedRound()],
    total: partial.total,
    toPar: partial.toPar ?? null,
    thru: partial.thru ?? null,
    officialPosition: partial.officialPosition ?? null,
  };
}

function team(id: string, division: FourBallTeam["division"], names: [string, string], value: FourBallScore | null): FourBallTeam {
  return { id, division, divisionLabel: division === "mid-am" ? "Mid-Amateur" : "Senior", names, score: value };
}

const twoRounds = (first: number, second: number, total: number): FourBallScore =>
  score({
    total,
    rounds: [
      { strokes: first, status: "complete" },
      { strokes: second, status: "complete" },
      notPostedRound(),
    ],
  });

const fixture: FourBallTeam[] = [
  team("fixture-a", "mid-am", ["Fixture Alpha", "Fixture Bravo"], twoRounds(68, 72, 140)),
  team("fixture-b", "mid-am", ["Fixture Charlie", "Fixture Delta"], twoRounds(70, 70, 140)),
  team("fixture-c", "senior", ["Fixture Echo", "Fixture Foxtrot"], score({
    total: null,
    rounds: [{ strokes: 35, status: "incomplete" }, notPostedRound(), notPostedRound()],
    thru: "9",
  })),
  team("fixture-d", "senior", ["Fixture Golf", "Fixture Hotel"], twoRounds(65, 65, 130)),
  team("fixture-e", "mid-am", ["Fixture India", "Fixture Juliet"], score({
    total: 70,
    rounds: [{ strokes: 70, status: "complete" }, notPostedRound(), notPostedRound()],
  })),
];

const rows = standings(fixture);
const order = rows.map((row) => row.id);
if (order.indexOf("fixture-a") > order.indexOf("fixture-d")) throw new Error("All view ranked a senior team ahead of the mid-am group");
const midPlaces = rows.filter((row) => row.division === "mid-am" && row.position === "T1");
if (midPlaces.length !== 2) throw new Error("Mid-am tie was not ranked inside the division");
const seniorLeader = rows.find((row) => row.id === "fixture-d");
if (seniorLeader?.position !== "1") throw new Error("Senior leader was ranked against Mid-Am");
const shortRound = rows.find((row) => row.id === "fixture-e");
if (shortRound?.position != null || shortRound?.rankNote !== "in_progress") throw new Error("Unequal completed rounds were ranked");
const incomplete = rows.find((row) => row.id === "fixture-c");
if (!incomplete || incomplete.position != null || incomplete.rankNote !== "in_progress") throw new Error("Incomplete team was ranked");
if (totalCell(incomplete.score) !== "") throw new Error("Missing total was rendered as a number");

const html = renderToStaticMarkup(createElement(FourBallBoard, { rows }));
for (const needle of ["Fixture Alpha", "Fixture Echo", "140", "T1", "35", "Not posted", "In progress"]) {
  if (!html.includes(needle)) throw new Error(`Fixture board missing ${needle}`);
}
if (html.includes(">0<")) throw new Error("Fixture board printed a fabricated zero");

const official = standings([
  team("off-a", "mid-am", ["Official One", "Official Two"], score({ ...twoRounds(70, 70, 140), officialPosition: "T4" })),
]);
if (official[0]?.position !== "T4" || official[0].rankNote !== "official") throw new Error("Official place was recomputed");

const mixed = standings([
  team("mix-official", "mid-am", ["Mix Official", "Mix Partner"], score({ ...twoRounds(70, 70, 140), officialPosition: "T4" })),
  team("mix-derived", "mid-am", ["Mix Derived", "Mix Other"], twoRounds(68, 68, 136)),
]);
const mixedOfficial = mixed.find((row) => row.id === "mix-official");
const mixedDerived = mixed.find((row) => row.id === "mix-derived");
if (mixedOfficial?.position !== "T4" || mixedOfficial.rankNote !== "official") throw new Error("Mixed board recomputed the official place");
if (mixedDerived?.position != null) throw new Error("Mixed board derived a place beside an official place");

const nineOfRoundOne = score({
  total: 40,
  thru: "9",
  rounds: [{ strokes: 40, status: "incomplete" }, notPostedRound(), notPostedRound()],
});
const nineOfRoundTwo = score({
  total: 110,
  thru: "9",
  rounds: [
    { strokes: 70, status: "complete" },
    { strokes: 40, status: "incomplete" },
    notPostedRound(),
  ],
});
if (progressKey(nineOfRoundOne) !== "partial:0:0:9") throw new Error(`Round 1 thru 9 key was ${progressKey(nineOfRoundOne)}`);
if (progressKey(nineOfRoundTwo) !== "partial:1:1:9") throw new Error(`Round 2 thru 9 key was ${progressKey(nineOfRoundTwo)}`);
if (progressKey(nineOfRoundOne) === progressKey(nineOfRoundTwo)) throw new Error("Nine holes of different rounds compared as one key");
const splitRounds = standings([
  team("thru-r1", "mid-am", ["Thru Round One", "Partner One"], nineOfRoundOne),
  team("thru-r2", "mid-am", ["Thru Round Two", "Partner Two"], nineOfRoundTwo),
]);
if (splitRounds.find((row) => row.id === "thru-r1")?.position != null) throw new Error("Round 1 thru 9 was ranked with round 2 thru 9");
if (splitRounds.find((row) => row.id === "thru-r2")?.position !== "1") throw new Error("The further round was not the only ranked card");

const pars = [72, 72, null];
const padded = auditScore(score({
  total: 140,
  thru: "18",
  rounds: [{ strokes: 70, status: "incomplete" }, notPostedRound(), notPostedRound()],
}), pars);
if (!padded.some((problem) => problem.includes("partial total"))) throw new Error("A partial total that pads a missing round was accepted");
const good = auditScore(twoRounds(70, 72, 142), pars);
if (good.length) throw new Error(`Valid total failed: ${good.join("; ")}`);
const bad = auditScore(twoRounds(70, 72, 150), pars);
if (!bad.some((problem) => problem.includes("does not match"))) throw new Error("Mismatched total was accepted");
const partial = auditScore(score({
  total: 35,
  rounds: [{ strokes: 35, status: "incomplete" }, notPostedRound(), notPostedRound()],
}), pars);
if (!partial.some((problem) => problem.includes("thru"))) throw new Error("Partial total without thru was accepted");
const toPar = auditScore({ ...twoRounds(70, 72, 142), toPar: -2 }, pars);
if (toPar.length) throw new Error(`Supported to-par failed: ${toPar.join("; ")}`);
const unsupported = auditScore({ ...twoRounds(70, 72, 142), toPar: -2 }, [null, 72, null]);
if (!unsupported.some((problem) => problem.includes("to-par"))) throw new Error("To-par without Blue par was accepted");

const withdrawn = score({
  total: 144,
  officialPosition: "WD",
  rounds: [
    { strokes: 75, status: "complete" },
    { strokes: 69, status: "complete" },
    { strokes: null, status: "withdrawn" },
  ],
});
if (roundCell(withdrawn, 2) !== "WD") throw new Error("Withdrawn round did not render as WD");
if (totalCell(withdrawn) !== "144") throw new Error("Withdrawn total was not the completed-round sum");
const withdrawnAudit = auditScore(withdrawn, [72, 72, 72]);
if (withdrawnAudit.length) throw new Error(`Valid withdrawn card failed: ${withdrawnAudit.join("; ")}`);
const withdrawnToPar = auditScore({ ...withdrawn, toPar: 0 }, [72, 72, 72]);
if (!withdrawnToPar.some((problem) => problem.includes("withdrawn"))) throw new Error("To-par on a withdrawn card was accepted");
const withdrawnZero = auditScore({
  ...withdrawn,
  rounds: [
    { strokes: 75, status: "complete" },
    { strokes: 69, status: "complete" },
    { strokes: 0, status: "complete" },
  ],
  total: 144,
}, [72, 72, 72]);
if (!withdrawnZero.some((problem) => problem.includes("strokes are not a posted total") || problem.includes("does not match"))) {
  throw new Error("A fabricated zero on a withdrawn round was accepted");
}
const withdrawnBoard = standings([
  team("wd-finisher", "mid-am", ["Wd Finisher", "Wd Partner"], score({ ...twoRounds(62, 70, 132), officialPosition: "1" })),
  team("wd-team", "mid-am", ["Wd One", "Wd Two"], withdrawn),
]);
if (withdrawnBoard[0]?.id !== "wd-finisher") throw new Error("A withdrawal was ranked ahead of a finisher");
if (withdrawnBoard[1]?.position !== "WD" || withdrawnBoard[1].rankNote !== "official") throw new Error("Withdrawal place was not official WD");
const withdrawnHtml = renderToStaticMarkup(createElement(FourBallBoard, { rows: withdrawnBoard }));
if (!withdrawnHtml.includes("WD")) throw new Error("Board did not print WD");
if (withdrawnHtml.includes(">0<")) throw new Error("Withdrawn board printed a fabricated zero");

verifyEwingSnapshot();

if (!hasTimezoneOffset("2026-11-13T18:00:00-05:00")) throw new Error("DST offset -05:00 was rejected");
if (!hasTimezoneOffset("2026-11-07T19:04:00-06:00")) throw new Error("Standard offset -06:00 was rejected");
if (hasTimezoneOffset("2026-11-07T19:04:00")) throw new Error("Missing offset was accepted");
if (EWING_SNAPSHOT.leaderboardStatus === "source_pending" && EWING_SNAPSHOT.teams.some((team) => team.score != null)) {
  throw new Error("Pre-event snapshot includes a score");
}
if (EWING_SNAPSHOT.teams.some((team) => team.names.includes("Fixture Alpha"))) throw new Error("Fixture names leaked into the live snapshot");

const midAm = EWING_SNAPSHOT.teams.filter((team) => team.division === "mid-am");
if (midAm.length !== 32) throw new Error(`Expected 32 mid-am teams, got ${midAm.length}`);
for (const team of midAm) {
  const score = team.score;
  if (!score || score.rounds[0]?.status !== "complete" || score.rounds[0].strokes == null) {
    throw new Error(`${team.names.join(" + ")} is missing a completed round 1`);
  }
  if (score.rounds[1]?.status !== "complete" || score.rounds[1].strokes == null) {
    throw new Error(`${team.names.join(" + ")} is missing a completed round 2`);
  }
  if (score.officialPosition === "WD") {
    if (score.rounds[2]?.status !== "withdrawn" || score.rounds[2].strokes != null) {
      throw new Error(`${team.names.join(" + ")} is not recorded as withdrawn in the final round`);
    }
    if (score.total !== score.rounds[0].strokes + score.rounds[1].strokes) {
      throw new Error(`${team.names.join(" + ")} withdrawn total does not match rounds 1 and 2`);
    }
    if (score.toPar != null) throw new Error(`${team.names.join(" + ")} has a to-par after withdrawing`);
    continue;
  }
  if (score.rounds[2]?.status !== "complete" || score.rounds[2].strokes == null) {
    throw new Error(`${team.names.join(" + ")} is missing a completed final round`);
  }
  if (score.total !== score.rounds[0].strokes + score.rounds[1].strokes + score.rounds[2].strokes) {
    throw new Error(`${team.names.join(" + ")} total does not match all three rounds`);
  }
}
const midAmBoard = standings(midAm, "mid-am");
if (midAmBoard[0]?.names.join(" + ") !== "Robbie Keyes + Michael Sass") throw new Error("Final-round winner was not first");
if (midAmBoard[0]?.position !== "1" || midAmBoard[0].rankNote !== "official") throw new Error("Final-round winner place was not official");
if (midAmBoard[0]?.score?.total !== 198 || midAmBoard[0]?.score?.toPar !== -18) throw new Error("Winner total was not 198, -18");
if (midAmBoard[0]?.score?.rounds[2]?.strokes !== 66) throw new Error("Winner final-round score was not 66");
if (midAmBoard[1]?.names.join(" + ") !== "Michael Randle + Zac Verses" || midAmBoard[1]?.score?.total !== 205) {
  throw new Error("Runner-up was not Randle and Verses at 205");
}
if (midAmBoard.some((row) => row.rankNote !== "official" || !row.position)) throw new Error("A mid-am team was missing its official place");
if (midAmBoard.map((row) => row.position).join(",") !== "1,2,T3,T3,T5,T5,T7,T7,T7,T10,T10,T10,T10,T10,T15,T15,T15,T18,T18,T18,T21,T21,T23,T23,25,26,T27,T27,29,30,WD,WD") {
  throw new Error("Final official place order changed");
}
if (midAmBoard.find((row) => row.names.join(" + ") === "Steve Paterson + Austin Chung")?.score?.rounds[2]?.strokes !== 65) {
  throw new Error("Paterson and Chung did not have the low final round of 65");
}
if (midAmBoard.find((row) => row.names.join(" + ") === "James Minahan + Charlie Holland")?.position !== "T18") {
  throw new Error("Defending champions should be T18");
}
if (midAmBoard.find((row) => row.names.join(" + ") === "Jonathan Keane + Andrew Grice")?.position !== "T23") {
  throw new Error("Keane and Grice should be T23");
}
if (midAmBoard.find((row) => row.names.join(" + ") === "Jonathan Keane + Andrew Grice")?.score?.total !== 214) {
  throw new Error("Keane and Grice total was not 214");
}
const withdrawals = midAmBoard.filter((row) => row.position === "WD");
if (withdrawals.length !== 2) throw new Error("Expected two mid-am withdrawals");
if (withdrawals.some((row) => row.score?.rounds[2]?.status !== "withdrawn" || roundCell(row.score, 2) !== "WD")) {
  throw new Error("A withdrawal did not render as WD in the final round");
}
if (withdrawals[0]?.names.join(" + ") !== "Sam Elkington + Zach Tracy" || withdrawals[0]?.score?.total !== 144) {
  throw new Error("Elkington and Tracy withdrawal was not recorded correctly");
}
if (withdrawals[1]?.names.join(" + ") !== "Ryder Espon + Matt Kendrick" || withdrawals[1]?.score?.total !== 147) {
  throw new Error("Espon and Kendrick withdrawal was not recorded correctly");
}

const senior = EWING_SNAPSHOT.teams.filter((team) => team.division === "senior");
if (senior.length !== 20) throw new Error(`Expected 20 senior teams, got ${senior.length}`);
for (const team of senior) {
  const score = team.score;
  if (!score || score.rounds[0]?.status !== "complete" || score.rounds[0].strokes == null) {
    throw new Error(`${team.names.join(" + ")} is missing a completed round 1`);
  }
  if (score.rounds[1]?.status !== "complete" || score.rounds[1].strokes == null) {
    throw new Error(`${team.names.join(" + ")} is missing a completed round 2`);
  }
  if (score.rounds[2]?.status !== "not_posted" || score.rounds[2].strokes != null) {
    throw new Error(`${team.names.join(" + ")} has a posted final round before that round was played`);
  }
  if (score.total !== score.rounds[0].strokes + score.rounds[1].strokes) {
    throw new Error(`${team.names.join(" + ")} total does not match rounds 1 and 2`);
  }
}
const seniorBoard = standings(senior, "senior");
if (seniorBoard[0]?.names.join(" + ") !== "Mike Lohner + Todd Vancil") throw new Error("Senior round 2 co-leader was not first");
if (seniorBoard[1]?.names.join(" + ") !== "Lewis Stephenson + Lee Sandlin") throw new Error("Senior round 2 co-leader was not second");
if (seniorBoard[0]?.position !== "T1" || seniorBoard[0].rankNote !== "official") throw new Error("Senior round 2 leader place was not official");
if (seniorBoard[0]?.score?.total !== 137 || seniorBoard[0]?.score?.toPar !== -7) throw new Error("Senior round 2 leader total was not 137, -7");
if (seniorBoard.some((row) => row.rankNote !== "official" || !row.position)) throw new Error("A senior team was missing its official place");
if (seniorBoard.at(-1)?.names.join(" + ") !== "Gene Aube + Russ Childers" || seniorBoard.at(-1)?.position !== "20") {
  throw new Error("Senior round 2 last place was not 20th");
}
if (seniorBoard.at(-1)?.score?.total !== 155) throw new Error("Senior round 2 last place total was not 155");
if (seniorBoard.map((row) => row.position).join(",") !== "T1,T1,3,4,5,T6,T6,8,T9,T9,T11,T11,T11,T11,T15,T15,T17,T17,19,20") {
  throw new Error("Senior round 2 official place order changed");
}
if (seniorBoard.find((row) => row.names.join(" + ") === "John Stollenwerck + Neal Barfield")?.position !== "3") {
  throw new Error("Senior Stollenwerck and Barfield should be 3rd after round 2");
}
if (senior.some((team) => team.names.includes("John Stollenwerck Jr"))) {
  throw new Error("Mid-am John Stollenwerck Jr was merged into the senior field");
}
if (senior.some((team) => team.names.includes("Mike Felker"))) throw new Error("Mike Felker is still listed after the official substitution");

console.log("four-ball tests ok");
