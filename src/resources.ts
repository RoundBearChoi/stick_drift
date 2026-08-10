import { Loader } from 'excalibur';
import { debugFontSource } from './debug_font';

const loader = new Loader();
loader.addResource(debugFontSource);

export { loader };
