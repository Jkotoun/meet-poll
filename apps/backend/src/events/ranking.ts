export interface Tally {
  yes: number;
  ifNeedBe: number;
}

// Score = how many people can attend; more "yes" breaks a tie, because those
// people want the slot rather than tolerate it.
function beats(a: Tally, b: Tally): boolean {
  const scoreA = a.yes + a.ifNeedBe;
  const scoreB = b.yes + b.ifNeedBe;
  return scoreA > scoreB || (scoreA === scoreB && a.yes > b.yes);
}

// Competition ranking: equal tallies share a rank and the next one skips
// ("1, 1, 3"). Quadratic, which is nothing at 50 slots.
export function rankSlots(tallies: Tally[]): number[] {
  return tallies.map(
    (tally) => 1 + tallies.filter((other) => beats(other, tally)).length,
  );
}
