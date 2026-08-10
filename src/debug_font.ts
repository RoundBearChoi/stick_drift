import {
  FontSource,
  ImageFiltering,
  Font,
  TextAlign,
  BaseAlign,
} from 'excalibur';

/**
 * QuinqueFive — 5×5 monospaced pixel font
 * Use only at multiples of 5 (5, 10, 15, 20...) with Pixel filtering for maximum crispness.
 * .woff2 is the recommended format: smallest file size + full browser support.
 */
export const debugFontSource = new FontSource(
  './res/fonts/QuinqueFive.woff2',
  'QuinqueFive',
  {
    filtering: ImageFiltering.Pixel,
    size: 5,
  }
);

// designed size or integer multiple of 5
// 5 → 10 → 15 → 20, etc.
export function createCenterFont(): Font {
  return debugFontSource.toFont({
    size: 5,
    filtering: ImageFiltering.Pixel,
    textAlign: TextAlign.Center,
    baseAlign: BaseAlign.Middle,
  });
}

export function createTopLeftFont(): Font {
  return debugFontSource.toFont({
    size: 5,
    filtering: ImageFiltering.Pixel,
    textAlign: TextAlign.Left,
    baseAlign: BaseAlign.Top,
  });
}
