import { Loader, FontSource, ImageFiltering, Font, TextAlign, BaseAlign } from 'excalibur';

export const pressStartFontSource = new FontSource(
  './res/fonts/press_start.ttf',
  'press_start',
  {
    filtering: ImageFiltering.Pixel,
    size: 16,
  }
);

const loader = new Loader();
loader.addResource(pressStartFontSource);

export { loader };

/** centered text (TextAlign.Center + BaseAlign.Middle) */
export function createCenterFont(): Font {
  return pressStartFontSource.toFont({
    size: 16,
    filtering: ImageFiltering.Pixel,
    textAlign: TextAlign.Center,
    baseAlign: BaseAlign.Middle,
  });
}

/** top-left text (TextAlign.Left + BaseAlign.Top) */
export function createTopLeftFont(): Font {
  return pressStartFontSource.toFont({
    size: 16,
    filtering: ImageFiltering.Pixel,
    textAlign: TextAlign.Left,
    baseAlign: BaseAlign.Top,
  });
}
