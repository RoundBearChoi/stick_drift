import { Actor } from 'excalibur';

export const Z_ORDER = {
  world: 0,
  hud: 1000,
} as const;

export type ZOrderLayer = keyof typeof Z_ORDER;

export function assignZ(actor: Actor, layer: ZOrderLayer): void {
  actor.z = Z_ORDER[layer];
}
