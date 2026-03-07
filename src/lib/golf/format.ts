/**
 * Formatting utilities for golf handicap display.
 */

/** Format a handicap index for user-facing display.
 *  Negative values (plus handicaps) display with a "+" prefix.
 *  Standard values display as-is with one decimal place.
 */
export function formatHandicap(handicapIndex: number): string {
  if (handicapIndex < 0) {
    return `+${Math.abs(handicapIndex).toFixed(1)}`;
  }
  return handicapIndex.toFixed(1);
}
