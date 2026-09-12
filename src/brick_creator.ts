import { Actor, Engine, Vector, vec } from 'excalibur';
import { Resources } from './resources';
import { applySpriteRenderOffset } from './sprite_render';
import { BrickType, DEFAULT_BRICK_TYPE } from './brick_type';

export interface BrickCreateOptions {
  pos?: Vector;
  type?: BrickType;
}

/**
 * scene owns the actor and is responsible for add / remove.
 */
export function createBrick(
  engine: Engine,
  options: BrickCreateOptions = {}
): Actor {
  const type = options.type ?? DEFAULT_BRICK_TYPE;

  const actor = new Actor({
    pos: options.pos ?? vec(0, 0),
    anchor: vec(0, 0), // top left pivot for easy registration on uint8array grid
  });

  const sheet =
    type === BrickType.Brick16x16
      ? Resources.brick_16x16.getSpriteSheet()
      : null;

  if (type === BrickType.Brick16x16 && !sheet) {
    console.warn('Brick spritesheet not loaded yet');
  }

  if (type === BrickType.Brick8x8) {
    console.warn('8x8 brick sprite not added yet — placing empty actor');
  }

  const spr = sheet?.getSprite(0, 0);
  if (spr) {
    actor.graphics.use(spr);
    applySpriteRenderOffset(actor);
  }

  return actor;
}
