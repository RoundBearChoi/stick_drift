import { Color } from 'excalibur';

/**
 * Official Dracula palette (subset).
 * Single source of truth for all game colors.
 * https://draculatheme.com/contribute
 */
export const DraculaColorScheme = {
  /** #282a36 – main background */
  background: Color.fromHex('#282a36'),

  /** #f8f8f2 – official Dracula foreground (slightly warmer than pure white) */
  white: Color.fromHex('#f8f8f2'),

  /** #ff79c6 – official Dracula pink */
  pink: Color.fromHex('#ff79c6'),
} as const;

export type DraculaColorScheme = typeof DraculaColorScheme;
