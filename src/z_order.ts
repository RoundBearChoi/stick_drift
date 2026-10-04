import { Actor } from 'excalibur';

export const Z_ORDER = {
  environment: 1,
  runner: 10,
  runner_vfx: 100,
  debug_graphics: 200,
  trail_light: 300,
  hud: 1000,
} as const;

export type ZOrderLayer = keyof typeof Z_ORDER;

export function assignZ(actor: Actor, layer: ZOrderLayer): void {
  actor.z = Z_ORDER[layer];
}
