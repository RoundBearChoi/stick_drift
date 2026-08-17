import { Actor, Engine, Vector, vec } from 'excalibur';
import { Resources } from './resources';

export interface BrickCreateOptions {
  pos?: Vector;
}

/**
 * scene still owns the actor and is responsible for add / remove.
 */
export function createBrick(
  engine: Engine,
  options: BrickCreateOptions = {}
): Actor {
  const sheet = Resources.brick.getSpriteSheet();
  if (!sheet) {
    console.warn('Brick spritesheet not loaded yet');
  }

  const spr = sheet?.getSprite(0, 0);

  // bottom-center anchor so it sits on the same floor reference as the runner
  const actor = new Actor({
    pos: options.pos ?? vec(0, 0),
    anchor: vec(0, 0), // top left pivot for easy registration on uint8array grid
  });

  if (spr) {
    actor.graphics.use(spr);
  }

  return actor;
}
