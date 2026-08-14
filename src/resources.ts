import { TerminalLoader } from './terminal_loader';
import { debugFontSource } from './debug_font';
/** plugin-aesprite loads + parses the files and convert them to excalibur's graphics objects */
import { AsepriteResource, AsepriteSpriteSheet } from '@excaliburjs/plugin-aseprite';

export const Resources = {
  stick_runner_idle: new AsepriteResource('./res/sprites/stick_runner_idle.aseprite'),
  stick_runner_run: new AsepriteResource('./res/sprites/stick_runner_run.aesprite'),

  work_in_progress: new AsepriteResource('./res/sprites/work_in_progress.aseprite'),
} as const;

const loader = new TerminalLoader();

// added resources load during excalibur's initial screen
loader.addResource(debugFontSource);
loader.addResource(Resources.stick_runner_idle);
loader.addResource(Resources.work_in_progress);

export { loader };
