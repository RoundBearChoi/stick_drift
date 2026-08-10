import {
  FontSource,
  ImageFiltering,
  Font,
  TextAlign,
  BaseAlign,
} from 'excalibur';

/**
 * mem mono 4x4 — 4×4 monospaced pixel font (from the mem font family)
 * Use only at multiples of 4 (4, 8, 12, 16...) with Pixel filtering for maximum crispness.
 * Currently only .ttf is available in the repo.
 */
export const debugFontSource = new FontSource(
  './res/fonts/mem_mono_4x4.ttf',
  'mem mono 4x4',
  {
    filtering: ImageFiltering.Pixel,
    size: 8,
  }
);

// designed size or integer multiple of 4
// 4 → 8 → 12 → 16, etc.
export function createCenterFont(): Font {
  return debugFontSource.toFont({
    size: 8,
    filtering: ImageFiltering.Pixel,
    textAlign: TextAlign.Center,
    baseAlign: BaseAlign.Middle,
  });
}

export function createTopLeftFont(): Font {
  return debugFontSource.toFont({
    size: 8,
    filtering: ImageFiltering.Pixel,
    textAlign: TextAlign.Left,
    baseAlign: BaseAlign.Top,
  });
}
