import { Actor, Engine, Vector, vec } from 'excalibur';
import { Resources } from './resources';
import { applySpriteRenderOffset } from './sprite_render';
import {
  SpikeType,
  SpikeFacing,
  DEFAULT_SPIKE_TYPE,
  DEFAULT_SPIKE_FACING,
  spikeDef,
  spikeFacingToRadians,
} from './spike_type';

// arguments are optional and callers don't have to remember argument order.
export interface SpikeCreateOptions {
  spike_pos?: Vector;
  spike_type?: SpikeType;
  spike_facing?: SpikeFacing;
}

export function createSpike(
  engine: Engine,
  options: SpikeCreateOptions = {}
): Actor {
  const type = options.spike_type ?? DEFAULT_SPIKE_TYPE; // if options.spike_type isn't null or undefined, use it. otherwise use default value.
  const facing = options.spike_facing ?? DEFAULT_SPIKE_FACING;
  const { width, height } = spikeDef(type); // right now we only have 16x16 spike type.

  const actor = new Actor({
    pos: options.spike_pos ?? vec(0, 0),
    anchor: vec(0, 0), // top left pivot for easy registration on uint8array grid
  });

  const sheet =
    type === SpikeType.Spike16x16 ?
      Resources.spikes_16x16.getSpriteSheet() : null;

  if (!sheet) {
    console.warn(`${type} spike spritesheet not loaded yet`);
  }

  /*
  clone so each placement can rotate without sharing graphic state.
  if sheet or 0 0 sprite is missing, spr is undefined, and the function keeps going
  */
  const spr = sheet?.getSprite(0, 0)?.clone();

  if (spr) {
    actor.graphics.use(spr);
    applySpriteRenderOffset(actor);
  }

  applySpikeGraphicFacing(actor, facing, width, height);

  return actor;
}

/**
 * rotate graphic around its center.
 */
export function applySpikeGraphicFacing(
  actor: Actor,
  facing: SpikeFacing,
  width: number,
  height: number
): void {
  const graphic = actor.graphics.current;
  if (!graphic) return;

  graphic.origin = vec(width / 2, height / 2);
  graphic.rotation = spikeFacingToRadians(facing);
}
