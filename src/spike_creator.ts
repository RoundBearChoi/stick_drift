import { Actor, Engine, Vector, vec } from 'excalibur';
import { Resources } from './resources';
import { applySpriteRenderOffset } from './sprite_render';
import { SpikeType, DEFAULT_SPIKE_TYPE } from './spike_type';

export interface SpikeCreateOptions {
  pos?: Vector;
  type?: SpikeType;
}

/**
 * scene owns the actor and is responsible for add / remove.
 */
export function createSpike(
  engine: Engine,
  options: SpikeCreateOptions = {}
): Actor {
  const type = options.type ?? DEFAULT_SPIKE_TYPE;

  const actor = new Actor({
    pos: options.pos ?? vec(0, 0),
    anchor: vec(0, 0), // top left pivot for easy registration on uint8array grid
  });

  const sheet =
    type === SpikeType.Spike16x16
      ? Resources.spikes_16x16.getSpriteSheet()
      : null;

  if (!sheet) {
    console.warn(`${type} spike spritesheet not loaded yet`);
  }

  const spr = sheet?.getSprite(0, 0);
  if (spr) {
    actor.graphics.use(spr);
    applySpriteRenderOffset(actor);
  }

  return actor;
}
