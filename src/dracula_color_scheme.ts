import { Color } from 'excalibur';

/**
 * canonical palette. never hand these objects out directly.
 * https://draculatheme.com/contribute
 */
const palette = {
  /** #282a36 – official Dracula background */
  background: Color.fromHex('#282a36'),

  /** #44475a – current line / selection */
  selection_color: Color.fromHex('#44475a'),

  /** #f8f8f2 – official Dracula foreground (slightly warmer than pure white) */
  white: Color.fromHex('#f8f8f2'),

  /** #6272a4 – official Dracula comment color */
  comment_color: Color.fromHex('#6272a4'),

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

/**
 * single source of truth for all game colors.
 * every access returns a clone so a local variant (alpha, tint, …)
 * cannot mutate the palette.
 */
export const DraculaColorScheme = {
  get background() {
    return palette.background.clone();
  },
  get selection_color() {
    return palette.selection_color.clone();
  },
  get white() {
    return palette.white.clone();
  },
  get comment_color() {
    return palette.comment_color.clone();
  },
  get cyan() {
    return palette.cyan.clone();
  },
  get green() {
    return palette.green.clone();
  },
  get orange() {
    return palette.orange.clone();
  },
  get pink() {
    return palette.pink.clone();
  },
  get purple() {
    return palette.purple.clone();
  },
  get red() {
    return palette.red.clone();
  },
  get yellow() {
    return palette.yellow.clone();
  },
};

export type DraculaColorScheme = typeof DraculaColorScheme;
