import {
  FontSource,
  ImageFiltering,
  Font,
  TextAlign,
  BaseAlign,
} from 'excalibur';

/**
 * Debug / UI font helpers.
 * Not game content — just for labels, FPS, prompts, etc.
 */
export const debugFontSource = new FontSource(
  './res/fonts/press_start.ttf',
  'press_start',
  {
    filtering: ImageFiltering.Pixel,
    size: 16,
  }
);

/** centered text (TextAlign.Center + BaseAlign.Middle) */
export function createCenterFont(): Font {
  return debugFontSource.toFont({
    size: 16,
    filtering: ImageFiltering.Pixel,
    textAlign: TextAlign.Center,
    baseAlign: BaseAlign.Middle,
  });
}

/** top-left text (TextAlign.Left + BaseAlign.Top) */
export function createTopLeftFont(): Font {
  return debugFontSource.toFont({
    size: 16,
    filtering: ImageFiltering.Pixel,
    textAlign: TextAlign.Left,
    baseAlign: BaseAlign.Top,
  });
}
