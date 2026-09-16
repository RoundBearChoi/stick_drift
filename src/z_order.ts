import { Entity } from 'excalibur';

/**
 * draw order. higher paints later (on top).
 * world is Excalibur's default.
 */
export const Z_ORDER = {
  world: 0,
  hud: 1000,
} as const;

export type ZOrderLayer = keyof typeof Z_ORDER;

export function assignZ(entity: Entity, layer: ZOrderLayer): void {
  entity.z = Z_ORDER[layer];
}
