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

export interface SpikeCreateOptions {
  pos?: Vector;
  type?: SpikeType;
  facing?: SpikeFacing;
}

export function createSpike(
  engine: Engine,
  options: SpikeCreateOptions = {}
): Actor {
  const type = options.type ?? DEFAULT_SPIKE_TYPE;
  const facing = options.facing ?? DEFAULT_SPIKE_FACING;
  const { width, height } = spikeDef(type);

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

  // clone so each placement can rotate without sharing graphic state
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
