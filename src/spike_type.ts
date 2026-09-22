export enum SpikeType {
  Spike16x16 = '16x16',
}

export const SPIKE_TYPES = Object.values(SpikeType) as SpikeType[];

export const DEFAULT_SPIKE_TYPE = SpikeType.Spike16x16;

/**
 * clockwise from default (up).
 * IMPORTANT: for now everything is a square, so facing does not change the top-left AABB.
 */
export enum SpikeFacing {
  Up = 0,
  Right = 1,
  Down = 2,
  Left = 3,
}

export const DEFAULT_SPIKE_FACING = SpikeFacing.Up;

export function nextSpikeFacingClockwise(facing: SpikeFacing): SpikeFacing {
  return ((facing + 1) % 4) as SpikeFacing;
}

export function spikeFacingLabel(facing: SpikeFacing): string {
  switch (facing) {
    case SpikeFacing.Up:
      return 'UP';
    case SpikeFacing.Right:
      return 'RIGHT';
    case SpikeFacing.Down:
      return 'DOWN';
    case SpikeFacing.Left:
      return 'LEFT';
  }
}

/**
 * 90 degree clockwise per facing step.
 * IMPORTANT: this is render only. actor pos stays top-left.
 */
export function spikeFacingToRadians(facing: SpikeFacing): number {
  return (facing * Math.PI) / 2;
}

export interface SpikeDef {
  width: number;
  height: number;
}

export const SPIKE_DEFS: Record<SpikeType, SpikeDef> = {
  [SpikeType.Spike16x16]: { width: 16, height: 16 },
};

export function spikeDef(type: SpikeType): SpikeDef {
  return SPIKE_DEFS[type];
}

export function nextSpikeType(current: SpikeType): SpikeType {
  const i = SPIKE_TYPES.indexOf(current);
  return SPIKE_TYPES[(i + 1) % SPIKE_TYPES.length];
}
