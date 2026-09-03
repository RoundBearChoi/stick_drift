export function transferAirUpToWallSlideUp(current_air_up_vector: number): number {
  if (current_air_up_vector <= 0) return 0;
  if (current_air_up_vector >= 12) return 10;

  switch (current_air_up_vector) {
    case 11: return 9;
    case 10: return 9;
    case 9: return 8;
    case 8: return 7;
    case 7: return 6;
    case 6: return 5;
    case 5: return 4;
    case 4: return 3;
    case 3: return 3;
    case 2: return 2;
    case 1: return 1;
    default: return 0;
  }
}
