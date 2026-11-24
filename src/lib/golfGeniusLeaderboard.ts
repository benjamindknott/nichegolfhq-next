import * as cheerio from "cheerio";
import {
  AJGA_LEADERBOARD_REVALIDATE_SECONDS,
  type AjgaLeaderboard,
  type AjgaLeaderboardDivision,
  type AjgaLeaderboardRow,
} from "@/lib/ajgaLeaderboard";

/**
 * Live leaderboard from a Golf Genius tournament portal.
 *
 * A portal (www.golfgenius.com/pages/<id>, or an event subdomain such as
 * svji-2026juniorinvitational.golfgenius.com) embeds a results widget
 * (/leagues/<id>/widgets/tournament_results or customized_tournament_results),
 * either on its home page or on a "Leaderboard" / "Results" page it links to.
 * The widget lists one link per division, each opening /v2tournaments/<eventId>:
 * plain public HTML holding the same `table.result_scope` markup AJGA embeds.
 * We read those tables and nothing else, and never fill in a value the source
 * left blank. Any failure returns `null` and the hub keeps its scoring link.
 *
 * The table reader mirrors parseAjgaLeaderboard on purpose: keeping the two
 * separate means a Golf Genius change cannot break the AJGA board mid-event.
 */

const USER_AGENT = "nichegolfHQ live leaderboard (+https://www.nichegolfhq.com)";
const RESULTS_WIDGET = /\/leagues\/\d+\/widgets\/(?:customized_)?tournament_results[^"'\s<>]*/;
const RESULTS_LINK_TEXT = /^(leaderboard|results|tournament results)$/i;
const MAX_RESULTS_PAGES = 3;
const MAX_DIVISIONS = 6;

export function isGolfGeniusUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "golfgenius.com" || host.endsWith(".golfgenius.com");
  } catch {
    return false;
  }
}

function clean(text: string | undefined | null) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

async function getHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: AJGA_LEADERBOARD_REVALIDATE_SECONDS },
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

function widgetUrlIn(html: string, base: string): string | null {
  const match = html.match(RESULTS_WIDGET);
  return match ? new URL(match[0].replace(/&amp;/g, "&"), base).toString() : null;
}

/** The results widget on the portal page, or on the first Leaderboard/Results page that has one. */
async function findResultsWidget(portalUrl: string): Promise<string | null> {
  const home = await getHtml(portalUrl);
  if (!home) return null;
  const direct = widgetUrlIn(home, portalUrl);
  if (direct) return direct;

  const $ = cheerio.load(home);
  const pages = $("a")
    .filter((_, a) => RESULTS_LINK_TEXT.test(clean($(a).text())))
    .map((_, a) => $(a).attr("href") ?? "")
    .get()
    .filter(Boolean)
    .map((href) => new URL(href, portalUrl).toString())
    .filter((url, index, all) => isGolfGeniusUrl(url) && all.indexOf(url) === index)
    .slice(0, MAX_RESULTS_PAGES);

  for (const pageUrl of pages) {
    const page = await getHtml(pageUrl);
    const widget = page ? widgetUrlIn(page, pageUrl) : null;
    if (widget) return widget;
  }
  return null;
}

/**
 * Short division names from the widget's link text, e.g.
 * "2026 Junior Orange Bowl Boys - 2026 Junior Orange Bowl Boys" -> "Boys",
 * "2026 Junior Invitational (Girls) - Girls Division" -> "Girls".
 */
function divisionLabels(texts: string[]): string[] {
  const words = texts.map((text) => {
    const parts = text.split(" - ");
    return clean(parts[parts.length - 1]).split(" ").filter(Boolean);
  });
  if (words.length > 1) {
    while (words.every((w) => w.length > 1 && w[0] === words[0][0])) words.forEach((w) => w.shift());
    while (words.every((w) => w.length > 1 && w[w.length - 1] === words[0][words[0].length - 1])) {
      words.forEach((w) => w.pop());
    }
  }
  return words.map((w, index) => w.join(" ") || `Division ${index + 1}`);
}

export function parseGolfGeniusResults(html: string, label: string): AjgaLeaderboardDivision | null {
  const $ = cheerio.load(html);
  const table = $("table.result_scope").first();
  if (!table.length) return null;

  const roundLabels = table
    .find("tr.header th.past_round_total")
    .map((_, th) => clean($(th).text()))
    .get()
    .filter(Boolean);

  const rows: AjgaLeaderboardRow[] = [];
  table.find("tr.aggregate-row").each((_, tr) => {
    const $tr = $(tr);
    const cell = (selector: string) => $tr.children(`td.${selector}`).first();
    const nameCell = cell("name");
    const name =
      clean(nameCell.find(".player .Link").first().text()) ||
      clean($tr.attr("data-aggregate-name")) ||
      clean(nameCell.clone().find(".affiliation").remove().end().text());
    if (!name) return;

    const rounds = $tr
      .children("td.past_round_total")
      .map((_, td) => clean($(td).text()) || null)
      .get() as Array<string | null>;

    rows.push({
      pos: clean(cell("pos").text()),
      name,
      hometown: clean(nameCell.find(".affiliation").first().text()) || undefined,
      toPar: clean(cell("score").text()) || "-",
      thru: clean(cell("past_round_thru").text()),
      today: clean(cell("past_round_to_par").text()) || "-",
      rounds: roundLabels.map((_, index) => rounds[index] ?? null),
      total: clean(cell("total").text()),
    });
  });

  return rows.length ? { label, roundLabels, rows } : null;
}

export async function fetchGolfGeniusLeaderboard(portalUrl: string): Promise<AjgaLeaderboard | null> {
  if (!isGolfGeniusUrl(portalUrl)) return null;
  try {
    const widget = await findResultsWidget(portalUrl);
    if (!widget) return null;
    const widgetHtml = await getHtml(widget);
    if (!widgetHtml) return null;

    const $ = cheerio.load(widgetHtml);
    const seen = new Set<string>();
    const links: Array<{ id: string; text: string }> = [];
    $("a[data-tournament-event-id]").each((_, a) => {
      const id = clean($(a).attr("data-tournament-event-id"));
      if (!/^\d+$/.test(id) || seen.has(id)) return;
      seen.add(id);
      links.push({ id, text: clean($(a).text()) });
    });
    if (!links.length) return null;

    const shown = links.slice(0, MAX_DIVISIONS);
    const labels = divisionLabels(shown.map((link) => link.text));
    const pages = await Promise.all(
      shown.map((link) => getHtml(new URL(`/v2tournaments/${link.id}`, widget).toString())),
    );
    const divisions = pages
      .map((html, index) => (html ? parseGolfGeniusResults(html, labels[index]) : null))
      .filter((division): division is AjgaLeaderboardDivision => Boolean(division));
    if (!divisions.length) return null;

    return {
      tournamentId: shown.map((link) => link.id).join(","),
      url: portalUrl,
      divisions,
      fetchedAt: new Date().toISOString(),
      source: "Golf Genius",
    };
  } catch {
    return null;
  }
}
