import { TerminalLoader } from './terminal_loader';
import { debugFontSource } from './debug_font';
/** plugin-aesprite loads + parses the files and convert them to excalibur's graphics objects */
import { AsepriteResource } from '@excaliburjs/plugin-aseprite';

export const Resources = {
  sprite_runner: new AsepriteResource('./res/sprites/runner_untitled_2_dracula_theme.aseprite'),
  sprite_wip_text: new AsepriteResource('./res/sprites/wip_text_528_158.aseprite'),
} as const;

const loader = new TerminalLoader();

// added resources load during excalibur's initial screen
loader.addResource(debugFontSource);
loader.addResource(Resources.sprite_runner);
loader.addResource(Resources.sprite_wip_text);

export { loader };
