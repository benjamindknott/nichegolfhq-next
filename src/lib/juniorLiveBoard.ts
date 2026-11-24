import { fetchAjgaLeaderboard, type AjgaLeaderboard } from "@/lib/ajgaLeaderboard";
import { ajgaTournamentIdFor } from "@/lib/ajgaTournamentId";
import { fetchGolfGeniusLeaderboard, isGolfGeniusUrl } from "@/lib/golfGeniusLeaderboard";

/** The fields a junior event's live board is read from. */
type LiveBoardSource = { ajgaTournamentId?: string; golfGeniusUrl?: string };

/**
 * True when a junior hub can read this event's scoring link into its own live
 * board: an AJGA tournament, or a Golf Genius portal.
 */
export function hasJuniorLiveBoardSource(event: LiveBoardSource): boolean {
  return Boolean(ajgaTournamentIdFor(event)) || isGolfGeniusUrl(event.golfGeniusUrl);
}

/**
 * The live board for a junior event: AJGA when the event has an AJGA id,
 * otherwise its Golf Genius portal. `null` when neither reads, so the hub
 * keeps its scoring link.
 */
export async function fetchJuniorLiveBoard(event: LiveBoardSource): Promise<AjgaLeaderboard | null> {
  const ajgaId = ajgaTournamentIdFor(event);
  if (ajgaId) return fetchAjgaLeaderboard(ajgaId);
  if (event.golfGeniusUrl && isGolfGeniusUrl(event.golfGeniusUrl)) {
    return fetchGolfGeniusLeaderboard(event.golfGeniusUrl);
  }
  return null;
}
