import { TerminalLoader } from './terminal_loader';
import { debugFontSource } from './debug_font';

const loader = new TerminalLoader();
loader.addResource(debugFontSource);

export { loader };
