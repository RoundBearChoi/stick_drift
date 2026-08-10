import { Loader, FontSource, ImageFiltering } from 'excalibur';

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
