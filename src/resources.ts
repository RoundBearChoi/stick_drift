import { TerminalLoader } from './terminal_loader';
import { debugFontSource } from './debug_font';
import { AsepriteResource } from '@excaliburjs/plugin-aseprite';

export const Resources = {
  sprite_runner: new AsepriteResource('./res/sprites/runner_untitled_1.aseprite'),
  sprite_wip_text: new AsepriteResource('./res/sprites/wip_text.aseprite'),
} as const;

const loader = new TerminalLoader();
loader.addResource(debugFontSource);
loader.addResource(Resources.sprite_runner);
loader.addResource(Resources.sprite_wip_text);

export { loader };
