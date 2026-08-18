import { Actor, Vector, vec } from 'excalibur';

/**
 * render only 1px offset for all sprite actors (bricks, runner, etc).
 * this does not (should not) affect world position, anchors, solid grid, or colliders, etc.
 */
export const SPRITE_RENDER_OFFSET: Vector = vec(0, -1);

export function applySpriteRenderOffset(actor: Actor): void {
  actor.graphics.offset = SPRITE_RENDER_OFFSET;
}
