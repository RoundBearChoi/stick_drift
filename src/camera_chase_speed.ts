/** pixels past the deadzone */
export function chaseSpeedFromOverflowX(overflow: number): number {
  if (overflow <= 0) return 0;
  if (overflow >= 225) return 10;

  if (overflow <= 16) return 2;
  if (overflow <= 40) return 3;
  if (overflow <= 72) return 4;
  if (overflow <= 112) return 5;
  if (overflow <= 160) return 6;
  if (overflow <= 224) return 8;

  return 10;
}

/** pixels past the deadzone */
export function chaseSpeedFromOverflowY(overflow: number): number {
  if (overflow <= 0) return 0;
  if (overflow >= 177) return 16;

  if (overflow <= 12) return 2;
  if (overflow <= 24) return 4;
  if (overflow <= 48) return 6;
  if (overflow <= 80) return 8;
  if (overflow <= 120) return 10;
  if (overflow <= 176) return 13;

  return 16;
}
