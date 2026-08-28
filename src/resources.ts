import { TerminalLoader } from './terminal_loader';
import { debugFontSource } from './debug_font';
/** plugin-aesprite loads + parses the files and convert them to excalibur's graphics objects */
import { AsepriteResource, AsepriteSpriteSheet } from '@excaliburjs/plugin-aseprite';

export const Resources = {
  stick_runner_idle: new AsepriteResource('./res/sprites/stick_runner_idle.aseprite'),
  stick_runner_run: new AsepriteResource('./res/sprites/stick_runner_run.aseprite'),
  stick_runner_jump: new AsepriteResource('./res/sprites/stick_runner_jump.aseprite'),
  stick_runner_fall: new AsepriteResource('./res/sprites/stick_runner_fall.aseprite'),
  stick_runner_run_accel: new AsepriteResource('./res/sprites/stick_runner_run_accel.aseprite'),

  work_in_progress: new AsepriteResource('./res/sprites/work_in_progress.aseprite'),

  brick: new AsepriteResource('./res/sprites/16x16_brick.aseprite'),
} as const;

const loader = new TerminalLoader();

// added resources load during excalibur's initial screen
loader.addResource(debugFontSource);
loader.addResource(Resources.stick_runner_idle);
loader.addResource(Resources.stick_runner_run);
loader.addResource(Resources.stick_runner_jump);
loader.addResource(Resources.stick_runner_fall);
loader.addResource(Resources.stick_runner_run_accel);
loader.addResource(Resources.work_in_progress);
loader.addResource(Resources.brick);

export { loader };
