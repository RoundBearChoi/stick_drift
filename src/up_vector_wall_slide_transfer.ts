/**
 * integer-only ~85% transfer from remaining air-up into wall-slide-up.
 * jump_up_starting_momentum is 12 (max). anything above 12 uses the 12 row.
 *
 * 12 -> 10
 * 11 -> 9
 * 10 -> 9
 *  9 -> 8
 *  8 -> 7
 *  7 -> 6
 *  6 -> 5
 *  5 -> 4
 *  4 -> 3
 *  3 -> 3
 *  2 -> 2
 *  1 -> 1
 *  0 -> 0
 */
export function transferAirUpToWallSlideUp(current_air_up_vector: number): number {
  if (current_air_up_vector <= 0) return 0;
  if (current_air_up_vector >= 12) return 10;

  switch (current_air_up_vector) {
    case 11:
      return 9;
    case 10:
      return 9;
    case 9:
      return 8;
    case 8:
      return 7;
    case 7:
      return 6;
    case 6:
      return 5;
    case 5:
      return 4;
    case 4:
      return 3;
    case 3:
      return 3;
    case 2:
      return 2;
    case 1:
      return 1;
    default:
      return 0;
  }
}
