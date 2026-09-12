export enum BrickType {
  Brick8x8 = '8x8',
  Brick16x16 = '16x16',
}

/** editor + gameplay_test_scene_2 keep planting this until 8x8 art exists */
export const DEFAULT_BRICK_TYPE = BrickType.Brick16x16;

export interface BrickDef {
  width: number;
  height: number;
}

export const BRICK_DEFS: Record<BrickType, BrickDef> = {
  [BrickType.Brick8x8]: { width: 8, height: 8 },
  [BrickType.Brick16x16]: { width: 16, height: 16 },
};

export function brickDef(type: BrickType): BrickDef {
  return BRICK_DEFS[type];
}
