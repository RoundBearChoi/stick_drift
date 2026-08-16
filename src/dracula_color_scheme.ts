import { Color } from 'excalibur';

/**
 * single source of truth for all game colors.
 * https://draculatheme.com/contribute
 */
export const DraculaColorScheme = {
  /** #282a36 – official Dracula background */
  background: Color.fromHex('#282a36'),

  /** #44475a – current line / selection */
  currentLine: Color.fromHex('#44475a'),

  /** #f8f8f2 – official Dracula foreground (slightly warmer than pure white) */
  white: Color.fromHex('#f8f8f2'),

  /** #6272a4 – comments / muted */
  comment: Color.fromHex('#6272a4'),

  /** #8be9fd – cyan */
  cyan: Color.fromHex('#8be9fd'),

  /** #50fa7b – green */
  green: Color.fromHex('#50fa7b'),

  /** #ffb86c – orange */
  orange: Color.fromHex('#ffb86c'),

  /** #ff79c6 – pink (good for accents) */
  pink: Color.fromHex('#ff79c6'),

  /** #bd93f9 – purple */
  purple: Color.fromHex('#bd93f9'),

  /** #ff5555 – official Dracula red */
  red: Color.fromHex('#ff5555'),

  /** #f1fa8c – yellow (good for bricks / platforms) */
  yellow: Color.fromHex('#f1fa8c'),
} as const;

export type DraculaColorScheme = typeof DraculaColorScheme;
