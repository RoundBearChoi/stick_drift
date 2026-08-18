import { Actor, Vector, vec } from 'excalibur';

/**
 * Visual-only shift applied to all sprite actors (bricks, runner, future sprites).
 * Does not affect world position, anchors, solid grid, or collider debug.
 */
export const SPRITE_RENDER_OFFSET: Vector = vec(0, -1);

export function applySpriteRenderOffset(actor: Actor): void {
  actor.graphics.offset = SPRITE_RENDER_OFFSET;
}
