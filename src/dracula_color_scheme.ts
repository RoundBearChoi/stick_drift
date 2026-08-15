import { Color } from 'excalibur';

/**
 * single source of truth for all game colors.
 * https://draculatheme.com/contribute
 */
export const DraculaColorScheme = {
  background: Color.fromHex('#282a36'),
  /** #f8f8f2 – official Dracula foreground (slightly warmer than pure white) */
  white: Color.fromHex('#f8f8f2'),
  pink: Color.fromHex('#ff79c6'),
  /** #ff5555 – official Dracula red */
  red: Color.fromHex('#ff5555'),
} as const;

export type DraculaColorScheme = typeof DraculaColorScheme;
