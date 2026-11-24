/**
 * AJGA tournament id for an event: the explicit `ajgaTournamentId` when set,
 * otherwise the number in an ajga.org/tournaments/<id>/... live-scoring link.
 * Deriving it from the link keeps it in step with the edition the link points at,
 * so a junior event only needs its AJGA scoring link to get the on-site board.
 */
export function ajgaTournamentIdFor(event: {
  ajgaTournamentId?: string;
  golfGeniusUrl?: string;
}): string | undefined {
  if (event.ajgaTournamentId) return event.ajgaTournamentId;
  const match = event.golfGeniusUrl?.match(/^https?:\/\/(?:www\.)?ajga\.org\/tournaments\/(\d+)/i);
  return match?.[1];
}
