export function transferDownVectorAcrossWallSlide(down_vector: number): number {
  if (down_vector <= 0) return 0;
  if (down_vector >= 15) return 12;

  switch (down_vector) {
    case 14: return 12;
    case 13: return 11;
    case 12: return 10;
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
