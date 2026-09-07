export function transferDownVectorAcrossWallSlide(down_vector: number): number {
  if (down_vector <= 0) return 0;
  if (down_vector >= 15) return 12;

  switch (down_vector) {
    case 14: return 6;
    case 13: return 5;
    case 12: return 5;
    case 11: return 4;
    case 10: return 3;
    case 9: return 3;
    case 8: return 3;
    case 7: return 2;
    case 6: return 2;
    case 5: return 1;
    case 4: return 1;
    case 3: return 0;
    case 2: return 0;
    case 1: return 0;
    default: return 0;
  }
}
