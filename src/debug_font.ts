import {
  FontSource,
  ImageFiltering,
  Font,
  TextAlign,
  BaseAlign,
} from 'excalibur';

export const debugFontSource = new FontSource(
  './res/fonts/press_start.ttf',
  'press_start',
  {
    filtering: ImageFiltering.Pixel,
    size: 16,
  }
);


// use the designed size or an integer multiple
// 8 → 16 → 24 → 32, etc.
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
