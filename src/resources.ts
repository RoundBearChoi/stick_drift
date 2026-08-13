import { TerminalLoader } from './terminal_loader';
import { debugFontSource } from './debug_font';
/** plugin-aesprite loads + parses the files and convert them to excalibur's graphics objects */
import { AsepriteResource } from '@excaliburjs/plugin-aseprite';

export const Resources = {
  sprite_runner: new AsepriteResource('./res/sprites/stick_runner_f8f8f2.aseprite'),
  sprite_wip_text: new AsepriteResource('./res/sprites/wiptext_f8f8f2.aseprite'),
} as const;

const loader = new TerminalLoader();

// added resources load during excalibur's initial screen
loader.addResource(debugFontSource);
loader.addResource(Resources.sprite_runner);
loader.addResource(Resources.sprite_wip_text);

export { loader };
