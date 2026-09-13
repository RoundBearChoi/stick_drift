export enum SpikeType {
  Spike16x16 = '16x16',
}

export const SPIKE_TYPES = Object.values(SpikeType) as SpikeType[];

export const DEFAULT_SPIKE_TYPE = SpikeType.Spike16x16;

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
